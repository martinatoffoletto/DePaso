"""
Vision module - Cargo size classification (spec 5.1, RF-VIS-01..04).

Model: MobileNetV2 transfer learning, trained by the team (ml/train_classifier.py),
exported as .keras and loaded here for inference.

Design grounded in the state of the art (Naumann et al. 2023): exact volume
estimation from a single phone photo (2D RGB) is infeasible without 3D
sensors, so the system classifies into predefined volumetric categories
instead — a CNN classification problem that transfer learning solves with
a small dataset.

When TensorFlow or the trained model file is missing (dev environments),
the service degrades to a deterministic stub so the API contract keeps
working; `model_loaded` tells the caller which path produced the result.
"""
import io

import structlog

from src.app.shared.enums import PackageSize

logger = structlog.get_logger(__name__)

# Output classes — index order MUST match training (ml/train_classifier.py).
CATEGORIES: list[str] = [
    PackageSize.S,
    PackageSize.M,
    PackageSize.L,
    PackageSize.XL,
]

IMG_SIZE = 224  # MobileNetV2 input (RNF-PERF-02: preprocessed to 224x224)


class VisionService:
    """Cargo size classifier service."""

    def __init__(self, model_path: str, confidence_threshold: float = 0.7) -> None:
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.model = None

    def load_model(self) -> bool:
        """Load the trained Keras model. Called once at startup (lifespan).

        Returns True if the real model is available, False if running in
        fallback mode.
        """
        try:
            import tensorflow as tf  # imported lazily: heavy, optional in dev

            self.model = tf.keras.models.load_model(self.model_path)
            logger.info("vision_model_loaded", path=self.model_path)
            return True
        except Exception as exc:  # ImportError or missing/corrupt model file
            logger.warning("vision_model_unavailable_using_stub", error=str(exc))
            self.model = None
            return False

    @property
    def model_loaded(self) -> bool:
        return self.model is not None

    def classify(self, image_bytes: bytes, has_reference_object: bool = False) -> dict:
        """Classify a package photo (RF-VIS-01).

        Returns: {category, confidence, needs_manual, model_loaded}
        needs_manual is True when confidence < threshold (RF-VIS-02) so the
        UI offers manual category input (RF-SHP-03).
        """
        if self.model is not None:
            category, confidence = self._predict(image_bytes, has_reference_object)
        else:
            category, confidence = self._stub_predict(image_bytes)

        return {
            "category": category,
            "confidence": round(confidence, 4),
            "needs_manual": confidence < self.confidence_threshold,
            "model_loaded": self.model_loaded,
        }

    # -- real inference ---------------------------------------------------------

    def _predict(self, image_bytes: bytes, has_reference_object: bool) -> tuple[str, float]:
        import numpy as np
        import tensorflow as tf

        img = tf.io.decode_image(image_bytes, channels=3, expand_animations=False)
        img = tf.image.resize(img, [IMG_SIZE, IMG_SIZE])
        img = tf.keras.applications.mobilenet_v2.preprocess_input(tf.cast(img, tf.float32))
        img_batch = tf.expand_dims(img, 0)
        ref_batch = np.array([[1.0 if has_reference_object else 0.0]], dtype="float32")

        probs = self.model.predict([img_batch, ref_batch], verbose=0)[0]
        idx = int(probs.argmax())
        return CATEGORIES[idx], float(probs[idx])

    # -- dev fallback -----------------------------------------------------------

    def _stub_predict(self, image_bytes: bytes) -> tuple[str, float]:
        """Deterministic placeholder keyed on image size so dev flows are stable."""
        try:
            from PIL import Image

            width, height = Image.open(io.BytesIO(image_bytes)).size
            area = width * height
        except Exception:
            area = len(image_bytes)
        idx = min(len(CATEGORIES) - 1, area % len(CATEGORIES))
        return CATEGORIES[idx], 0.50  # always below threshold -> suggests manual input

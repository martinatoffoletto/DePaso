"""
Vision module - Image classification using TensorFlow/Keras.
TODO: Load MobileNetV2 classifier at startup via lifespan.
Classify package images to predict size category (XS, S, M, L, XL, FREIGHT).
"""


class VisionService:
    """Service for image classification.
    
    TODO: Implement the following:
    - load_model() -> Keras model (called during app startup via lifespan)
    - preprocess_image(image_bytes) -> array
    - classify(image_bytes) -> {'category': 'M', 'confidence': 0.95}
    - batch_classify(images) -> list[{'category', 'confidence'}]
    
    Model: MobileNetV2 pretrained or fine-tuned on DePaso package images.
    Input: PIL Image or bytes
    Output: Package size class + confidence score
    Confidence threshold: 0.7 (configurable)
    """

    def __init__(self, model_path: str, confidence_threshold: float = 0.7) -> None:
        """Initialize with model path and confidence threshold."""
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.model = None  # Will be loaded during startup
        # TODO: Load model from model_path

    def load_model(self):
        """Load TensorFlow/Keras model."""
        # TODO: Implement model loading
        pass

    def classify(self, image_bytes: bytes) -> dict:
        """Classify image and return package size prediction."""
        # TODO: Implement classification
        pass

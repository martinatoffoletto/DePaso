"""
Tracking module - Shipment status and location tracking.
TODO: Implement status updates, location history, and real-time tracking.
Initial: REST polling. Future: WebSocket integration.
"""


class TrackingService:
    """Service for shipment tracking.
    
    TODO: Implement the following:
    - create_tracking_event(shipment_id, status, location_lat, location_lon, timestamp)
    - get_tracking_history(shipment_id) -> list[TrackingEvent]
    - get_current_location(shipment_id) -> (lat, lon, last_update_time)
    - update_status(shipment_id, new_status)
    
    Events:
    - PENDING: Waiting for carrier match
    - MATCHED: Assigned to carrier
    - PICKED_UP: Carrier picked up package
    - IN_TRANSIT: On the way
    - DELIVERED: Successfully delivered
    - FAILED: Delivery failed
    """

    def __init__(self, repository) -> None:
        """Initialize with repository."""
        self.repository = repository

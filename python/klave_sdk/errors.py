class KlaveError(Exception):
    def __init__(self, message: str, code: str, status: int | None = None, retryable: bool = False):
        super().__init__(message)
        self.code = code
        self.status = status
        self.retryable = retryable

// Lives on its own so both the real client and the mock can throw it without
// importing each other in a cycle.

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

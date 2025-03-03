export class QueueManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueueManagerError";
  }
}

export class InstallerError extends Error {
  constructor(type, message, details = {}) {
    super(message);
    this.name = "InstallerError";
    this.type = type;
    this.details = details;
  }
}

export function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new InstallerError("INTERRUPTED", "Installation was interrupted.");
  }
}

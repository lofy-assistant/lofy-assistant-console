declare module "fernet" {
  export class Secret {
    constructor(secret: string)
  }

  export class Token {
    constructor(options: { secret: Secret; token?: string; ttl?: number; time?: number; iv?: string })
    encode(message: string): string
    decode(): string
  }
}

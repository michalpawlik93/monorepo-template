export abstract class BasePrismaRepository<TClient> {
  constructor(private readonly getClient: () => TClient) {}

  protected get db(): TClient {
    return this.getClient();
  }
}

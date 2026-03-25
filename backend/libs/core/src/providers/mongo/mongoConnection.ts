import { injectable } from 'inversify';
import { MongoClient, Db } from 'mongodb';
import { Result, BasicError, ok, basicErr } from '../../utils/result';
import { type MongoConfig } from './types';
import { LoggerFactory } from '../../features/logging';

@injectable()
export class MongoConnection {
  public client: MongoClient;
  private db: Db | null = null;
  private readonly logger: ReturnType<LoggerFactory['forScope']>;

  constructor(
    private readonly config: MongoConfig,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.client = new MongoClient(config.uri);
    this.logger = this.loggerFactory.forScope('MONGO');
  }

  async connect(onFailure: () => void): Promise<Result<Db, BasicError>> {
    try {
      this.logger.info('Connecting to MongoDB...');
      await this.client.connect();
      this.db = this.client.db();
      this.logger.info('Connected to MongoDB');
      return ok(this.db);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        { error: errorMessage },
        'Failed to connect to MongoDB'
      );
      onFailure();
      return basicErr(`Failed to connect to MongoDB: ${errorMessage}`);
    }
  }

  async close(onFailure: () => void): Promise<Result<void, BasicError>> {
    try {
      if (this.client) {
        await this.client.close();
        this.db = null;
        this.logger.info('MongoDB connection closed');
        return ok(undefined);
      }
      return ok(undefined);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        { error: errorMessage },
        'Failed to close MongoDB connection'
      );
      onFailure();
      return basicErr(`Failed to close MongoDB connection: ${errorMessage}`);
    }
  }
}

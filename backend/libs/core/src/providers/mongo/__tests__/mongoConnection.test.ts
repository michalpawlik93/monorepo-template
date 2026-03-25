import 'reflect-metadata';
import { MongoConnection } from '../mongoConnection';
import { isOk, isErr } from '../../../utils/result';
import { LoggerFactory } from '../../../features/logging';
import type { ILogger } from '../../../features/logging/ILogger';
import { createLoggerFactoryMock } from '../../../features/logging/__fixtures__';

type MongoConfig = {
  uri: string;
};

const mockConnect = jest.fn();
const mockClose = jest.fn();
const mockDb = jest.fn().mockReturnValue({
  databaseName: 'amadeo-test',
});

jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    close: mockClose,
    db: mockDb,
  })),
}));

describe('MongoConnection', () => {
  let mongoConnection: MongoConnection;
  let loggerFactory: jest.Mocked<LoggerFactory>;
  let logger: jest.Mocked<ILogger>;

  beforeEach(() => {
    jest.clearAllMocks();
    const mongoConfig: MongoConfig = {
      uri: 'mongodb://localhost:27017/amadeo-test',
    };
    ({ factory: loggerFactory, logger } = createLoggerFactoryMock());
    mongoConnection = new MongoConnection(mongoConfig, loggerFactory);
  });

  afterEach(async () => {
    if (mongoConnection.client) {
      await mongoConnection.close(() => undefined);
    }
    jest.clearAllMocks();
  });

  it('should connect to MongoDB successfully', async () => {
    // Arrange
    mockConnect.mockResolvedValue(undefined);

    // Act
    const result = await mongoConnection.connect(() => undefined);

    // Assert
    expect(isOk(result)).toBeTruthy();
    if (isOk(result)) {
      expect(result.value).toBeDefined();
    }
    expect(mockConnect).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Connecting to MongoDB...');
    expect(logger.info).toHaveBeenCalledWith('Connected to MongoDB');
  });

  it('should close connection successfully', async () => {
    // Arrange
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);

    const connectResult = await mongoConnection.connect(() => undefined);
    expect(isOk(connectResult)).toBeTruthy();

    // Act
    const closeResult = await mongoConnection.close(() => undefined);

    // Assert
    expect(isOk(closeResult)).toBeTruthy();
    expect(mockClose).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('MongoDB connection closed');
  });

  it('should handle connection errors gracefully', async () => {
    // Arrange
    const errorMessage = 'Connection failed';
    mockConnect.mockRejectedValue(new Error(errorMessage));
    const onFailure = jest.fn();

    // Act
    const result = await mongoConnection.connect(onFailure);

    // Assert
    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.message).toContain('Failed to connect to MongoDB');
      expect(result.error.message).toContain(errorMessage);
    }
    expect(onFailure).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      { error: errorMessage },
      'Failed to connect to MongoDB'
    );
  });

  it('should handle disconnect errors gracefully', async () => {
    // Arrange
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockRejectedValue(new Error('Disconnect failed'));
    const onFailure = jest.fn();

    const connectResult = await mongoConnection.connect(() => undefined);
    expect(isOk(connectResult)).toBeTruthy();

    // Act
    const result = await mongoConnection.close(onFailure);

    // Assert
    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.message).toContain(
        'Failed to close MongoDB connection'
      );
      expect(result.error.message).toContain('Disconnect failed');
    }
    expect(onFailure).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      { error: 'Disconnect failed' },
      'Failed to close MongoDB connection'
    );
  });
});

describe('MongoConnection constructor', () => {
  it('should create connection with default URI', () => {
    const { factory } = createLoggerFactoryMock();

    // Act
    const connection = new MongoConnection(
      { uri: 'mongodb://localhost:27017/test' },
      factory
    );

    // Assert
    expect(connection).toBeInstanceOf(MongoConnection);
    expect(factory.forScope).toHaveBeenCalledWith('MONGO');
  });

  it('should create connection with custom URI', () => {
    // Arrange
    const customUri = 'mongodb://localhost:27017/custom-test';
    const { factory } = createLoggerFactoryMock();

    // Act
    const connection = new MongoConnection({ uri: customUri }, factory);

    // Assert
    expect(connection).toBeInstanceOf(MongoConnection);
    expect(factory.forScope).toHaveBeenCalledWith('MONGO');
  });
});

export interface MongoConfig {
  uri: string;
}

export interface MongoTokens {
  MONGODB_KEY: symbol;
  MONGOCONNECTION_KEY: symbol;
  MONGOCONFIG_KEY: symbol;
}

export const createMongoTokens = (scope?: string): MongoTokens => {
  const prefix = scope ? `${scope}:` : '';
  return {
    MONGODB_KEY: Symbol.for(`${prefix}MongoDB`),
    MONGOCONNECTION_KEY: Symbol.for(`${prefix}MongoConnection`),
    MONGOCONFIG_KEY: Symbol.for(`${prefix}MongoConfig`),
  };
};

export const MONGO_TOKENS = createMongoTokens();
export const CORE_MONGO_TOKENS = createMongoTokens('Core');

import { Container } from 'inversify';
import {
  type LoggerConfig,
  RequestContext,
} from '@app/core';
import { PrismaModuleConfig } from '@app/core/prisma';

export interface IdentityDomainConfig {
  prisma?: PrismaModuleConfig;
}

export interface IdentityModuleConfig extends IdentityDomainConfig {
  logger: LoggerConfig;
  coreContainer?: Container;
  requestContext?: RequestContext;
}


export const createIdentityModuleContainer = (
  config: IdentityModuleConfig,
): Container => {
    const container = new Container();
    return container;
};

export const registerIdentityDomain = (
  container: Container,
  config: IdentityDomainConfig,
): void => {
};

export const connectIdentityInfrastructure = async (
  container: Container,
): Promise<void> => {
};

export const disconnectIdentityInfrastructure = async (
  container: Container,
): Promise<void> => {
};

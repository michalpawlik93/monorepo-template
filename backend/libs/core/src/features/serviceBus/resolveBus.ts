import { Container } from 'inversify';
import { ICommandBus } from './serviceBus';
import { COMMAND_BUS_TOKENS } from './di';
import { Result, BasicError, ok, basicErr } from '../../utils/result';

export type Transport = 'inMemory' | 'grpc';
export const IN_MEMORY_TRANSPORT: Transport = 'inMemory';
export const GRPC_TRANSPORT: Transport = 'grpc';

export type BusResolver = (
  transport?: Transport,
) => Result<ICommandBus, BasicError>;

const getBusName = (transport: Transport): string => {
  return transport === IN_MEMORY_TRANSPORT
    ? 'InMemoryCommandBus'
    : 'GrpcCommandBus';
};

export const makeBusResolver = (container: Container): BusResolver => {
  return (transport?: Transport) => {
    if (!transport) {
      return basicErr('Transport is required');
    }

    const token =
      transport === IN_MEMORY_TRANSPORT
        ? COMMAND_BUS_TOKENS.InMemory
        : "Unknown";

    if (!container.isBound(token)) {
      const busName = getBusName(transport);
      return basicErr(`${busName} is not registered in the container`);
    }

    return ok(container.get<ICommandBus>(token));
  };
};

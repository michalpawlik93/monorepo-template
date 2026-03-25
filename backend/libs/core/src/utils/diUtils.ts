import { Container } from "inversify";
import { LOGGING_TYPES, RequestContext } from "../features";
import { bindOrRebind } from "./inversify";

export const bindRequestContext = (
  container: Container,
  requestContext?: RequestContext,
): void => {
  if (!requestContext) {
    return;
  }

  bindOrRebind(container, LOGGING_TYPES.RequestContext, () => {
    container
      .bind<RequestContext>(LOGGING_TYPES.RequestContext)
      .toConstantValue(requestContext);
  });
};

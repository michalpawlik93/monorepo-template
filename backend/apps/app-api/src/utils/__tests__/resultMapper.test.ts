import { err, ok } from '@app/core';
import { createReplyMock } from '../../__fixtures__/replyMock';
import { errorTypeToHttpStatus, mapResultToReply } from '../resultMapper';

describe('resultMapper', () => {
  it('maps successful result to configured success status', () => {
    const reply = createReplyMock();
    mapResultToReply(ok({ id: 'p1' }, ['created']), reply as never, 201);

    expect(reply.code).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({
      data: { id: 'p1' },
      messages: ['created'],
    });
  });

  it('maps NotFoundError to 404', () => {
    const reply = createReplyMock();
    mapResultToReply(
      err({ _type: 'NotFoundError', message: 'missing' }),
      reply as never,
    );

    expect(reply.code).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalledWith({
      error: { type: 'NotFoundError', message: 'missing' },
    });
  });

  it('maps UnauthorizedError to 401', () => {
    const reply = createReplyMock();
    mapResultToReply(
      err({ _type: 'UnauthorizedError', message: 'denied' }),
      reply as never,
    );

    expect(reply.code).toHaveBeenCalledWith(401);
  });

  it('maps TimeoutError to 504', () => {
    expect(errorTypeToHttpStatus('TimeoutError')).toBe(504);
  });

  it('maps unknown error type to 500', () => {
    expect(errorTypeToHttpStatus('SystemError')).toBe(500);
  });

  it('supports custom toPayload mapper for paged response shape', () => {
    const reply = createReplyMock();
    mapResultToReply(
      ok({ data: [{ id: 'p1' }], cursor: 'cursor-1' }),
      reply as never,
      200,
      (value) => ({ data: value.data, cursor: value.cursor }),
    );

    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      data: [{ id: 'p1' }],
      cursor: 'cursor-1',
    });
  });
});

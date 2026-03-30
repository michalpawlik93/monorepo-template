export type ReplyMock = {
  code: jest.Mock;
  send: jest.Mock;
};

export const createReplyMock = (): ReplyMock => {
  const reply = {
    code: jest.fn(),
    send: jest.fn(),
  };
  reply.code.mockReturnValue(reply);
  return reply;
};

import { createReplyMock } from '../../__fixtures__/replyMock';
import { requirePermission, requireRole } from '../authorize';

describe('authorize middleware', () => {
  it('allows request when role exists', async () => {
    const middleware = requireRole('admin');
    const request = {
      principal: { roles: ['admin'], permissions: [] },
    } as never;
    const reply = createReplyMock();

    await middleware(request, reply as never);

    expect(reply.code).not.toHaveBeenCalled();
  });

  it('returns 403 when role does not exist', async () => {
    const middleware = requireRole('admin');
    const request = {
      principal: { roles: ['user'], permissions: [] },
    } as never;
    const reply = createReplyMock();

    await middleware(request, reply as never);

    expect(reply.code).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        type: 'ForbiddenError',
        message: 'Missing role: admin',
      },
    });
  });

  it('allows request when permission exists', async () => {
    const middleware = requirePermission('products.delete');
    const request = {
      principal: { roles: ['admin'], permissions: ['products.delete'] },
    } as never;
    const reply = createReplyMock();

    await middleware(request, reply as never);

    expect(reply.code).not.toHaveBeenCalled();
  });

  it('returns 403 when permission does not exist', async () => {
    const middleware = requirePermission('products.delete');
    const request = {
      principal: { roles: ['admin'], permissions: ['products.read'] },
    } as never;
    const reply = createReplyMock();

    await middleware(request, reply as never);

    expect(reply.code).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        type: 'ForbiddenError',
        message: 'Missing permission: products.delete',
      },
    });
  });
});

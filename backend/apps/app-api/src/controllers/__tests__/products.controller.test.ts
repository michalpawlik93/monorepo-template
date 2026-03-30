import { IN_MEMORY_TRANSPORT, err, ok } from '@app/core';
import type { FastifyRequest } from 'fastify';
import { mockPagedProducts } from '../../__fixtures__/dtos/products';
import { createProductFacadeMock } from '../../__fixtures__/productFacadeMock';
import { createReplyMock } from '../../__fixtures__/replyMock';
import {
  createProductController,
  deleteProductController,
  getPagedProductsController,
} from '../products.controller';

describe('products.controller', () => {
  it('createProductController returns 201 on success', async () => {
    const productFacade = createProductFacadeMock();
    productFacade.invokeCreateProduct?.mockResolvedValue(ok({ id: 'p1' }));
    const controller = createProductController(productFacade as never);
    const request = {
      body: { name: 'Table', priceCents: 12900 },
    } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(productFacade.invokeCreateProduct).toHaveBeenCalledWith(
      request.body,
      { via: IN_MEMORY_TRANSPORT },
    );
    expect(reply.code).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({ data: { id: 'p1' } });
  });

  it('createProductController maps facade error', async () => {
    const productFacade = createProductFacadeMock();
    productFacade.invokeCreateProduct?.mockResolvedValue(
      err({ _type: 'ValidationError', message: 'invalid data' }),
    );
    const controller = createProductController(productFacade as never);
    const request = {
      body: { name: '', priceCents: 12900 },
    } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(reply.code).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      error: { type: 'ValidationError', message: 'invalid data' },
    });
  });

  it('deleteProductController returns 200 on success', async () => {
    const productFacade = createProductFacadeMock();
    productFacade.invokeDeleteProduct?.mockResolvedValue(ok({ id: 'p1' }));
    const controller = deleteProductController(productFacade as never);
    const request = { params: { id: 'p1' } } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(productFacade.invokeDeleteProduct).toHaveBeenCalledWith(
      { id: 'p1' },
      { via: IN_MEMORY_TRANSPORT },
    );
    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ data: { id: 'p1' } });
  });

  it('deleteProductController maps not found error to 404', async () => {
    const productFacade = createProductFacadeMock();
    productFacade.invokeDeleteProduct?.mockResolvedValue(
      err({ _type: 'NotFoundError', message: 'product not found' }),
    );
    const controller = deleteProductController(productFacade as never);
    const request = { params: { id: 'missing' } } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(reply.code).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalledWith({
      error: { type: 'NotFoundError', message: 'product not found' },
    });
  });

  it('getPagedProductsController returns flat { data, cursor } payload', async () => {
    const productFacade = createProductFacadeMock();
    productFacade.getPagedProducts?.mockResolvedValue(ok(mockPagedProducts()));
    const controller = getPagedProductsController(productFacade as never);
    const request = {
      body: { pageSize: 10, cursor: 'cursor-0' },
    } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(productFacade.getPagedProducts).toHaveBeenCalledWith(request.body, {
      via: IN_MEMORY_TRANSPORT,
    });
    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      data: [expect.objectContaining({ id: 'product-1' })],
      cursor: 'cursor-1',
    });
  });

  it('getPagedProductsController returns empty list payload', async () => {
    const productFacade = createProductFacadeMock();
    productFacade.getPagedProducts?.mockResolvedValue(
      ok(mockPagedProducts({ data: [], cursor: undefined })),
    );
    const controller = getPagedProductsController(productFacade as never);
    const request = { body: { pageSize: 10 } } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ data: [], cursor: undefined });
  });

  it('getPagedProductsController maps facade error', async () => {
    const productFacade = createProductFacadeMock();
    productFacade.getPagedProducts?.mockResolvedValue(
      err({ _type: 'SystemError', message: 'db down' }),
    );
    const controller = getPagedProductsController(productFacade as never);
    const request = { body: { pageSize: 10 } } as unknown as FastifyRequest;
    const reply = createReplyMock();

    await controller(request as never, reply as never);

    expect(reply.code).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      error: { type: 'SystemError', message: 'db down' },
    });
  });
});

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { isOk, BasicError, Result, Pager, PagerResult } from '@app/core';
import {
  CreateProductCommandContract,
  CreateProductResponseContract,
  IProductBaseFacade,
  ProductContract,
} from '@app/integration-contracts';
import { invokeCreateProduct } from './commands/invokeCreateProduct';
import { invokeGetPagedProducts } from './commands/invokeGetPagedProducts';

class ConsoleApp {
  constructor(
    private readonly productFacade: IProductBaseFacade,
  ) {}

  async run(): Promise<void> {
    const rl = createInterface({ input, output });
    let exit = false;

    while (!exit) {
      console.log('\n=== Console ===');
      console.log('1. Invoke create product');
      console.log('2. Get paged products');
      console.log('0. Exit');

      const choice = (await rl.question('Select option: ')).trim();

      switch (choice) {
        case '1':
          await this.handleInvokeProduct();
          break;
        case '2':
          await this.handleGetPagedProducts();
          break;
        case '0':
          exit = true;
          break;
        default:
          console.log('Unknown option. Please try again.');
      }
    }

    rl.close();
  }


  private buildProductPayload(): CreateProductCommandContract {
    return {
      id: `product-${Date.now()}`,
      name: 'Console sample product',
      priceCents: 1999,
    };
  }

  private async handleInvokeProduct(): Promise<void> {
    const payload = this.buildProductPayload();
    console.log('Invoking CreateProductCommand with payload:', payload);

    const result = await invokeCreateProduct(this.productFacade, payload);
    this.logInvokeResult(result);
  }


  private async handleGetPagedProducts(): Promise<void> {
    const pager: Pager = {
      pageSize: 5,
      cursor: undefined,
    };
    console.log('Fetching paged products with pager:', pager);

    const result = await invokeGetPagedProducts(this.productFacade, pager);
    this.logPagedProductsResult(result);
  }

  private logInvokeResult(
    result: Result<
      | CreateProductResponseContract,
      BasicError
    >,
  ): void {
    if (isOk(result)) {
      console.log('Invoke succeeded. Created entity:', result.value);
    } else {
      console.error(
        `Invoke failed: [${result.error._type}] ${result.error.message}`
      );
    }
  }

  private logPagedProductsResult(
    result: Result<PagerResult<ProductContract>, BasicError>,
  ): void {
    if (isOk(result)) {
      const { data, cursor } = result.value;
      console.log(`Fetched ${data.length} products`);
      console.log(data);
      console.log('Next cursor:', cursor ?? 'none');
    } else {
      console.error(
        `Fetching products failed: [${result.error._type}] ${result.error.message}`,
      );
    }
  }

}

export const runConsole = async (params: {
  productFacade: IProductBaseFacade;
}): Promise<void> => {
  const app = new ConsoleApp(params.productFacade);
  await app.run();
};

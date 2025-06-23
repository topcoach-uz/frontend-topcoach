import { Api, ApiConfig } from './Api';
import axiosInstance from './axiosInstance';

export class CustomApi<
  SecurityDataType = unknown,
> extends Api<SecurityDataType> {
  constructor(config: ApiConfig<SecurityDataType> = {}) {
    super({ ...config });
    this.instance = axiosInstance;
  }
}

export const api = new CustomApi();

import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsEthereumAddress(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEthereumAddress',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && /^0x[a-fA-F0-9]{40,}$/.test(value);
        },
      },
    });
  };
}

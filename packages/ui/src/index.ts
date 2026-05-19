// @aether/ui - Shared UI component exports

export const Button = ({ children, ...props }: any) => (
  <button {...props}>{children}</button>
);

export const Card = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
);

export const Input = (props: any) => <input {...props} />;

// More components will be added in next iteration

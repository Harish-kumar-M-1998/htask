/** Shared form control styles — ring-inset avoids focus ring clipping inside overflow containers */
export const formFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring';

export const formFieldBase =
  'rounded-lg border border-border bg-background text-sm transition-[border-color,box-shadow]';

export const inputClassName = `flex h-10 w-full ${formFieldBase} px-3 py-2 placeholder:text-muted-foreground ${formFocus}`;

export const selectClassName = `flex h-10 w-full ${formFieldBase} px-3 py-2 ${formFocus}`;

export const textareaClassName = `flex w-full ${formFieldBase} px-3 py-2 placeholder:text-muted-foreground resize-none ${formFocus}`;

export const selectSmClassName = `h-9 ${formFieldBase} px-2.5 ${formFocus}`;

/** Padding for toolbars / filter rows so hover shadows are not clipped */
export const formToolbarClass = 'overflow-visible p-0.5 -m-0.5';

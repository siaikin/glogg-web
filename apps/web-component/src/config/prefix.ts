export type COMPONENT_NAME_PREFIX = `glogg`;
export const COMPONENT_NAME_PREFIX = <const>`glogg`;

export type CSS_CLASS_NAME_PREFIX = COMPONENT_NAME_PREFIX;
export const CSS_CLASS_NAME_PREFIX = COMPONENT_NAME_PREFIX;

export type DOM_ID_NAME_PREFIX = COMPONENT_NAME_PREFIX;
export const DOM_ID_NAME_PREFIX = COMPONENT_NAME_PREFIX;

export function domIdJoinPrefix<DOM_ID extends string>(
  domId: DOM_ID
): `${DOM_ID_NAME_PREFIX}_${DOM_ID}` {
  return `${DOM_ID_NAME_PREFIX}_${domId}`;
}

export function componentNameJoinPrefix<COMPONENT_NAME extends string>(
  componentName: COMPONENT_NAME
): `${DOM_ID_NAME_PREFIX}-${COMPONENT_NAME}` {
  return `${COMPONENT_NAME_PREFIX}-${componentName}`;
}

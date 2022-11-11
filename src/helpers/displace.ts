export const displace = <T>(arr: T[], index: number) => [
  ...arr.slice(index),
  ...arr.slice(0, index),
];

export const displaceWithoutIndex = <T>(arr: T[], index: number) => [
  ...arr.slice(index + 1),
  ...arr.slice(0, index),
];

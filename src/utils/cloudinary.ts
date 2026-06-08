export const TRANSFORMS = {
  hero:       'f_auto,q_auto:good,w_1920',
  content:    'f_auto,q_auto,w_800',
  thumbnail:  'f_auto,q_auto,w_400,h_400,c_fill,g_face',
  logo:       'f_auto,q_auto,w_300',
  background: 'f_auto,q_auto,w_1600',
} as const;

export type TransformKey = keyof typeof TRANSFORMS;

export function cld(url: string, transforms: string = 'f_auto,q_auto'): string {
  return url.replace('/upload/', `/upload/${transforms}/`);
}

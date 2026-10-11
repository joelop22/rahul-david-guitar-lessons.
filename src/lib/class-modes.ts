// Published monthly lesson plans. Prices are in integer paise, not editable browser values.
export const classModes = {
  online: { title: 'Online Guitar Classes', short: 'Online', feePaise: 180000, lessons: 4, minutesPerLesson: 45, description: 'Live online lessons with flexible timing preferences, from beginner to advanced. Learn Malayalam and English songs.' },
  offline: { title: 'Offline Guitar Classes', short: 'In person', feePaise: 200000, lessons: 4, minutesPerLesson: 60, description: 'In-person guitar lessons with Rahul at the teacher’s location in Elamakkara, Kochi.' },
  home: { title: 'Home Guitar Tuition', short: 'Home tuition', feePaise: 200000, lessons: 4, minutesPerLesson: 60, description: 'One-to-one guitar tuition at your home. Travel charges are quoted for your address and approved before payment.' },
} as const;
export type ClassMode = keyof typeof classModes;
export function isClassMode(value: string): value is ClassMode { return Object.prototype.hasOwnProperty.call(classModes, value); }
export function feeForMode(mode: ClassMode) { return classModes[mode].feePaise; }

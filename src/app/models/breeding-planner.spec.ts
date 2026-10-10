import { BreedingStage, isActivePregnancy } from './breeding-planner';

describe('isActivePregnancy', () => {
  it('is true only while mated or confirmed', () => {
    expect(isActivePregnancy(BreedingStage.Mated)).toBeTrue();
    expect(isActivePregnancy(BreedingStage.Confirmed)).toBeTrue();
    expect(isActivePregnancy(BreedingStage.Planned)).toBeFalse();
    expect(isActivePregnancy(BreedingStage.Missed)).toBeFalse();
    expect(isActivePregnancy(BreedingStage.Whelped)).toBeFalse();
    expect(isActivePregnancy(undefined)).toBeFalse();
  });
});

import { activeBreedings, offspringPrereq } from './offspring-prereq';

describe('offspringPrereq', () => {
  const b = (status: string) => ({ id: status, status } as any);
  const p = (gender: string) => ({ id: gender, gender } as any);

  it('is ready when there is a non-voided breeding', () => {
    expect(offspringPrereq([b('Voided'), b('Done')], [])).toBe('ready');
  });

  it('needs a breeding when the breeder has a male and a female pet', () => {
    expect(offspringPrereq([b('Voided')], [p('male'), p('Female')])).toBe('needs-breeding');
  });

  it('needs pets when there is no male+female pair', () => {
    expect(offspringPrereq([], [])).toBe('needs-pets');
    expect(offspringPrereq([], [p('Female'), p('Female')])).toBe('needs-pets');
  });

  it('activeBreedings drops voided ones', () => {
    expect(activeBreedings([b('Started'), b('Voided'), b('InProcess')]).map(x => x.status))
      .toEqual(['Started', 'InProcess']);
  });
});

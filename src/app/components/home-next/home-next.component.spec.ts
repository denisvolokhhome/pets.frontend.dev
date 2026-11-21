import { HomeNextComponent } from './home-next.component';

describe('HomeNextComponent register CTA', () => {
  function make(loggedIn: boolean, breeder: boolean) {
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const auth = { hasValidToken: () => loggedIn, isBreeder: breeder } as any;
    return { cmp: new HomeNextComponent(router, auth), router };
  }

  it('sends guests to breeder registration', () => {
    const { cmp, router } = make(false, false);
    cmp.register('breeder');
    expect(router.navigate).toHaveBeenCalledWith(['/register'], { queryParams: { type: 'breeder' } });
  });

  it('sends a signed-in breeder to their pets', () => {
    const { cmp, router } = make(true, true);
    cmp.register('breeder');
    expect(router.navigate).toHaveBeenCalledWith(['/pets']);
  });

  it('sends other signed-in users to the dashboard', () => {
    const { cmp, router } = make(true, false);
    cmp.register('breeder');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});

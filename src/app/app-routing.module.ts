import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { UserComponent } from './components/user/user.component';
import { AuthGuard } from './guard/auth.guard';
import { BreederGuard } from './guard/breeder.guard';
import { LogoutComponent } from './components/logout/logout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PetsComponent } from './components/pets/pets.component';
import { BreedingsComponent } from './components/breedings/breedings.component';
import { SettingsComponent } from './components/settings/settings.component';
import { GeneralSettingsComponent } from './components/settings/general-settings/general-settings.component';
import { BreedingLocationsComponent } from './components/settings/breeding-locations/breeding-locations.component';
import { SearchPageComponent } from './components/search-page/search-page.component';
import { BreedingDetailComponent } from './components/breeding-detail/breeding-detail.component';
import { MessagesListComponent } from './components/settings/messages-list/messages-list.component';
import { MessageDetailComponent } from './components/settings/message-detail/message-detail.component';
import { PetSeekerRegistrationComponent } from './components/pet-seeker-registration/pet-seeker-registration.component';
import { GuestToAccountComponent } from './components/guest-to-account/guest-to-account.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { BreederySettingsComponent } from './components/settings/breedery-settings/breedery-settings.component';
import { NotificationSettingsComponent } from './components/settings/notification-settings/notification-settings.component';
import { SupportSettingsComponent } from './components/settings/support-settings/support-settings.component';
import { SubscriptionSettingsComponent } from './components/settings/subscription-settings/subscription-settings.component';
import { OffspringListComponent } from './components/offspring-list/offspring-list.component';
import { OffspringDetailComponent } from './components/offspring-detail/offspring-detail.component';
import { OffspringGridComponent } from './components/offspring-grid/offspring-grid.component';
import { FavoritesListComponent } from './components/favorites-list/favorites-list.component';
import { ServiceProviderRegistrationComponent } from './components/service-provider-registration/service-provider-registration.component';
import { ServicesComponent } from './components/services/services.component';
import { ServiceProviderGuard } from './guard/service-provider.guard';

import { PetSeekerGuard } from './guard/pet-seeker.guard';
import { MessageNewComponent } from './components/message-new/message-new.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { GenealogyComponent } from './components/genealogy/genealogy.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { TermsOfUseComponent } from './components/terms-of-use/terms-of-use.component';
import { CookiePolicyComponent } from './components/cookie-policy/cookie-policy.component';
import { AcceptableUsePolicyComponent } from './components/acceptable-use-policy/acceptable-use-policy.component';
import { BreederAgreementComponent } from './components/breeder-agreement/breeder-agreement.component';
import { RefundPolicyComponent } from './components/refund-policy/refund-policy.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'search-pets', component: SearchPageComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'terms-of-use', component: TermsOfUseComponent },
  { path: 'cookie-policy', component: CookiePolicyComponent },
  { path: 'acceptable-use-policy', component: AcceptableUsePolicyComponent },
  { path: 'breeder-agreement', component: BreederAgreementComponent },
  { path: 'refund-policy', component: RefundPolicyComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  { path: 'register', component: RegisterComponent },
  { path: 'register/pet-seeker', component: PetSeekerRegistrationComponent },
  { path: 'register/from-message', component: GuestToAccountComponent },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'user', component: UserComponent, canActivate: [AuthGuard] },
  { path: 'pets', component: PetsComponent, canActivate: [BreederGuard] },
  { path: 'breedings', component: BreedingsComponent, canActivate: [BreederGuard] },
  { path: 'breeding/:id', component: BreedingDetailComponent, canActivate: [BreederGuard] },
  { path: 'offsprings', component: OffspringListComponent, canActivate: [BreederGuard] },
  { path: 'offsprings/:id', component: OffspringDetailComponent, canActivate: [BreederGuard] },
  { path: 'breeder/:id/offsprings', component: OffspringGridComponent },
  { path: 'offspring/:id', component: OffspringDetailComponent }, // Public offspring detail
  { path: 'favorites/offsprings', component: FavoritesListComponent, canActivate: [PetSeekerGuard] },
  { path: 'genealogy', component: GenealogyComponent, canActivate: [BreederGuard] },
  { path: 'services', component: ServicesComponent, canActivate: [ServiceProviderGuard] },
  { path: 'messages', component: MessagesListComponent, canActivate: [AuthGuard] },
  { path: 'messages/new', component: MessageNewComponent, canActivate: [AuthGuard] },
  { path: 'messages/:id', component: MessageDetailComponent, canActivate: [AuthGuard] },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      { path: 'general', component: GeneralSettingsComponent },
      { path: 'breedery', component: BreederySettingsComponent, canActivate: [BreederGuard] },
      { path: 'locations', component: BreedingLocationsComponent, canActivate: [BreederGuard] },
      { path: 'notifications', component: NotificationSettingsComponent, canActivate: [BreederGuard] },
      { path: 'subscription', component: SubscriptionSettingsComponent, canActivate: [BreederGuard] },
      { path: 'support', component: SupportSettingsComponent }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

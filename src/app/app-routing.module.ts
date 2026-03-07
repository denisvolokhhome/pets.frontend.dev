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
// import { NotificationSettingsComponent } from './components/settings/notification-settings/notification-settings.component';
import { OffspringListComponent } from './components/offspring-list/offspring-list.component';
import { OffspringFormComponent } from './components/offspring-form/offspring-form.component';
import { OffspringDetailComponent } from './components/offspring-detail/offspring-detail.component';
import { OffspringGridComponent } from './components/offspring-grid/offspring-grid.component';
import { FavoritesListComponent } from './components/favorites-list/favorites-list.component';

import { MessageNewComponent } from './components/message-new/message-new.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'search-pets', component: SearchPageComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
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
  { path: 'offsprings/new', component: OffspringFormComponent, canActivate: [BreederGuard] },
  { path: 'offsprings/:id', component: OffspringDetailComponent, canActivate: [BreederGuard] },
  { path: 'offsprings/:id/edit', component: OffspringFormComponent, canActivate: [BreederGuard] },
  { path: 'breeder/:id/offsprings', component: OffspringGridComponent },
  { path: 'offspring/:id', component: OffspringDetailComponent }, // Public offspring detail
  { path: 'favorites/offsprings', component: FavoritesListComponent, canActivate: [AuthGuard] },
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
      { path: 'locations', component: BreedingLocationsComponent, canActivate: [BreederGuard] }
      // { path: 'notifications', component: NotificationSettingsComponent, canActivate: [BreederGuard] }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

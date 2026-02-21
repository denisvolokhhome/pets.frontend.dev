import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { TopMenuComponent } from './components/top-menu/top-menu.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserComponent } from './components/user/user.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LogoutComponent } from './components/logout/logout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LeftMenuComponent } from './components/left-menu/left-menu.component';
import { PetsComponent } from './components/pets/pets.component';
import { PetCardComponent } from './components/pet-card/pet-card.component';
import { SubMenuComponent } from './components/sub-menu/sub-menu.component';
import { PetGridComponent } from './components/pet-grid/pet-grid.component';
import {MatButtonModule} from '@angular/material/button';
import { PetAddComponent } from './components/pet-add/pet-add.component';
import { ModalComponent } from './components/modal/modal.component';
import {FloatLabelType, MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatRadioModule} from '@angular/material/radio';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatNativeDateModule} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatCardModule} from '@angular/material/card';
import { SearchPetsPipe } from './pipes/search-pets.pipe';
import { PetDeleteComponent } from './components/pet-delete/pet-delete.component';
import { PetEditComponent } from './components/pet-edit/pet-edit.component';
import { ProfileMenuComponent } from './components/profile-menu/profile-menu.component';
import { SettingsComponent } from './components/settings/settings.component';
import { GeneralSettingsComponent } from './components/settings/general-settings/general-settings.component';
import { BreedingLocationsComponent } from './components/settings/breeding-locations/breeding-locations.component';
import { BreedingsComponent } from './components/breedings/breedings.component';
import { BreedingModalComponent } from './components/breeding-modal/breeding-modal.component';
import { PetAssignmentComponent } from './components/pet-assignment/pet-assignment.component';
import { PuppyTableComponent } from './components/puppy-table/puppy-table.component';
import { MapComponent } from './components/map/map.component';
import { SearchControlsComponent } from './components/search-controls/search-controls.component';
import { BreederCardComponent } from './components/breeder-card/breeder-card.component';
import { BreederCardListComponent } from './components/breeder-card-list/breeder-card-list.component';
import { SearchPageComponent } from './components/search-page/search-page.component';
import { BreedingDetailComponent } from './components/breeding-detail/breeding-detail.component';
import { OffspringModalComponent } from './components/offspring-modal/offspring-modal.component';
import { ContactBreederComponent } from './components/contact-breeder/contact-breeder.component';
import { NotificationIconComponent } from './components/notification-icon/notification-icon.component';
import { MessagesListComponent } from './components/settings/messages-list/messages-list.component';
import { MessageDetailComponent } from './components/settings/message-detail/message-detail.component';
import { PetSeekerRegistrationComponent } from './components/pet-seeker-registration/pet-seeker-registration.component';
import { GuestToAccountComponent } from './components/guest-to-account/guest-to-account.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { BreederySettingsComponent } from './components/settings/breedery-settings/breedery-settings.component';
import { QuickBreedingAddComponent } from './components/quick-breeding-add/quick-breeding-add.component';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Leaflet imports
import { LeafletModule } from '@bluehalo/ngx-leaflet';




@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    TopMenuComponent,
    LoginComponent,
    RegisterComponent,
    UserComponent,
    LogoutComponent,
    DashboardComponent,
    LeftMenuComponent,
    PetsComponent,
    PetCardComponent,
    SubMenuComponent,
    PetGridComponent,
    PetAddComponent,
    ModalComponent,
    SearchPetsPipe,
    PetDeleteComponent,
    PetEditComponent,
    ProfileMenuComponent,
    SettingsComponent,
    GeneralSettingsComponent,
    BreedingLocationsComponent,
    BreedingsComponent,
    BreedingModalComponent,
    PetAssignmentComponent,
    PuppyTableComponent,
    MapComponent,
    SearchControlsComponent,
    BreederCardComponent,
    BreederCardListComponent,
    SearchPageComponent,
    BreedingDetailComponent,
    OffspringModalComponent,
    ContactBreederComponent,
    NotificationIconComponent,
    MessagesListComponent,
    MessageDetailComponent,
    PetSeekerRegistrationComponent,
    GuestToAccountComponent,
    AuthCallbackComponent,
    BreederySettingsComponent,
    QuickBreedingAddComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatCardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    LeafletModule,

  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    MessageService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

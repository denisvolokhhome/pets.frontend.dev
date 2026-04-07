import { NgModule, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
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
import { NotificationSettingsComponent } from './components/settings/notification-settings/notification-settings.component';
import { SubscriptionSettingsComponent } from './components/settings/subscription-settings/subscription-settings.component';
import { PricingSectionComponent } from './components/pricing-section/pricing-section.component';
import { SupportSettingsComponent } from './components/settings/support-settings/support-settings.component';
import { QuickBreedingAddComponent } from './components/quick-breeding-add/quick-breeding-add.component';
import { FilterWidgetComponent } from './components/shared/filter-widget/filter-widget.component';
import { OffspringListComponent } from './components/offspring-list/offspring-list.component';
import { OffspringFormComponent } from './components/offspring-form/offspring-form.component';
import { OffspringDetailComponent } from './components/offspring-detail/offspring-detail.component';
import { OffspringCardComponent } from './components/offspring-card/offspring-card.component';
import { OffspringGridComponent } from './components/offspring-grid/offspring-grid.component';
import { OffspringEditComponent } from './components/offspring-edit/offspring-edit.component';
import { FavoritesListComponent } from './components/favorites-list/favorites-list.component';
import { NotificationDropdownComponent } from './components/notification-dropdown/notification-dropdown.component';
import { BreederHelpWidgetComponent } from './components/breeder-help-widget/breeder-help-widget.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { PetDocumentsComponent } from './components/pet-documents/pet-documents.component';
import { OffspringDocumentsComponent } from './components/offspring-documents/offspring-documents.component';
import { GuestPromptModalComponent } from './components/guest-prompt-modal/guest-prompt-modal.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { GenealogyComponent } from './components/genealogy/genealogy.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { StarRatingComponent } from './components/star-rating/star-rating.component';
import { ReviewFormComponent } from './components/review-form/review-form.component';
import { ReviewPromptComponent } from './components/review-prompt/review-prompt.component';
import { PhoneMaskDirective } from './directives/phone-mask.directive';
import { AuthService } from './services/auth.service';
import { firstValueFrom } from 'rxjs';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { PaginatorModule } from 'primeng/paginator';
import { GalleriaModule } from 'primeng/galleria';

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
    NotificationSettingsComponent,
    SubscriptionSettingsComponent,
    SupportSettingsComponent,
    QuickBreedingAddComponent,
    FilterWidgetComponent,
    OffspringListComponent,
    OffspringFormComponent,
    OffspringGridComponent,
    FavoritesListComponent,
    ResetPasswordComponent,
    GenealogyComponent,
    VerifyEmailComponent,
    StarRatingComponent,
    PhoneMaskDirective,
    PricingSectionComponent,
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
    CardModule,
    DataViewModule,
    PaginatorModule,
    GalleriaModule,
    LeafletModule,
    NotificationDropdownComponent,
    BreederHelpWidgetComponent,
    OffspringCardComponent,
    OffspringEditComponent,
    PageHeaderComponent,
    PetDocumentsComponent,
    OffspringDocumentsComponent,
    GuestPromptModalComponent,
    ReviewFormComponent,
    ReviewPromptComponent,
  ],
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptorsFromDi()),
    MessageService,
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      
      // Only verify if there's a token
      if (authService.hasValidToken()) {
        // Use firstValueFrom to convert observable to promise
        return firstValueFrom(authService.IsLoggedIn()).catch((): null => {
          // If verification fails, auth service already set isLoggedIn to false
          // Just return to allow app to continue loading
          return null;
        });
      }
      return Promise.resolve();
    })
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

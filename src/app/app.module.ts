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
import { ToastrModule } from 'ngx-toastr';
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
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
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

  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi())
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

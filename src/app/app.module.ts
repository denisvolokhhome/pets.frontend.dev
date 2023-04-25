import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { TopMenuComponent } from './components/top-menu/top-menu.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserComponent } from './components/user/user.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LogoutComponent } from './components/logout/logout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LeftMenuComponent } from './components/left-menu/left-menu.component';
import { PetsComponent } from './components/pets/pets.component';

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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

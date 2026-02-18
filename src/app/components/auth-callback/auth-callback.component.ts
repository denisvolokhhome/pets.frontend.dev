import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  standalone: false,
  selector: 'app-auth-callback',
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <i class="material-icons">hourglass_empty</i>
          </div>
          <h1 class="auth-title">Completing Sign In...</h1>
          <p class="auth-subtitle">Please wait while we log you in</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .auth-card {
      background: white;
      border-radius: var(--border-radius);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      padding: 3rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .auth-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      border-radius: 50%;
      margin-bottom: 1.5rem;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .auth-logo i {
      font-size: 40px;
      color: white;
    }
    .auth-title {
      font-family: var(--font-primary);
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--dark-color);
      margin-bottom: 0.5rem;
    }
    .auth-subtitle {
      font-family: var(--font-secondary);
      font-size: 1rem;
      color: var(--text-secondary);
      margin: 0;
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get token from query params
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const error = params['error'];

      if (error) {
        // Handle error
        console.error('OAuth error:', error);
        this.router.navigate(['/login'], {
          queryParams: { error: 'oauth_failed' }
        });
        return;
      }

      if (token) {
        // Store token
        localStorage.setItem('id_token', token);
        
        // Redirect to dashboard
        this.router.navigate(['/dashboard']);
      } else {
        // No token, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }
}

import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
})
export class BottomNav {
  private authService = inject(AuthService);
  private router = inject(Router);

  public userRole = this.authService.userRole;

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}

import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Identity } from '../../services/auth';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
})
export class BottomNav {
  public authService = inject(Identity);
  private router = inject(Router);

  public userRole = this.authService.userRole;

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BranchService } from '../../core/services/branch';
import { UserService, UserProfile } from '../../core/services/user';
import { ToastService } from '../../core/services/ui/toast';
import { Branch } from '../../core/models';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './branch-list.html'
})
export class BranchList {
  private branchService = inject(BranchService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  // Estados reactivos
  branches = this.branchService.branches;
  managers = toSignal(this.userService.getManagers(), { initialValue: [] as UserProfile[] });
  
  loading = signal(false);
  showModal = signal(false);
  editingBranch = signal<Branch | null>(null);

  // Formulario
  branchForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    location: ['', [Validators.required]],
    managerId: ['', [Validators.required]]
  });

  openCreateModal() {
    this.editingBranch.set(null);
    this.branchForm.reset();
    this.showModal.set(true);
  }

  openEditModal(branch: Branch) {
    this.editingBranch.set(branch);
    this.branchForm.patchValue({
      name: branch.name,
      location: branch.location,
      managerId: branch.managerId
    });
    this.showModal.set(true);
  }

  async saveBranch() {
    if (this.branchForm.invalid) return;

    try {
      this.loading.set(true);
      const data = this.branchForm.value as any;

      if (this.editingBranch()) {
        await this.branchService.updateBranch(this.editingBranch()!.id, data);
        this.toast.show('Sede actualizada correctamente', 'success');
      } else {
        await this.branchService.createBranch(data);
        this.toast.show('Nueva sede abierta correctamente', 'success');
      }

      this.showModal.set(false);
    } catch (error: any) {
      console.error('Error al guardar sede:', error);
      this.toast.show('Error al procesar la solicitud', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  getManagerName(managerId: string): string {
    const manager = this.managers().find(m => m.uid === managerId);
    return manager ? manager.name : 'Sin Asignar';
  }
}

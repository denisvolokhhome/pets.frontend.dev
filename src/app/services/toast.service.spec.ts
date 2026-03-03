import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { MessageService } from 'primeng/api';

describe('ToastService', () => {
  let service: ToastService;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['add', 'clear']);
    
    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: MessageService, useValue: messageServiceSpy }
      ]
    });
    
    service = TestBed.inject(ToastService);
    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call MessageService.add for success toast', () => {
    const detail = 'Success message';
    const summary = 'Success';
    
    service.success(detail, summary);
    
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary,
      detail,
      life: 5000
    });
  });

  it('should call MessageService.add for error toast', () => {
    const detail = 'Error message';
    const summary = 'Error';
    
    service.error(detail, summary);
    
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  });

  it('should call MessageService.add for warning toast', () => {
    const detail = 'Warning message';
    const summary = 'Warning';
    
    service.warning(detail, summary);
    
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'warn',
      summary,
      detail,
      life: 5000
    });
  });

  it('should call MessageService.add for info toast', () => {
    const detail = 'Info message';
    const summary = 'Info';
    
    service.info(detail, summary);
    
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'info',
      summary,
      detail,
      life: 5000
    });
  });

  it('should use custom duration from options', () => {
    const detail = 'Custom duration';
    const summary = 'Success';
    const customDuration = 10000;
    
    service.success(detail, summary, { timeOut: customDuration });
    
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary,
      detail,
      life: customDuration
    });
  });

  it('should call MessageService.clear', () => {
    service.clear();
    expect(messageService.clear).toHaveBeenCalled();
  });
});

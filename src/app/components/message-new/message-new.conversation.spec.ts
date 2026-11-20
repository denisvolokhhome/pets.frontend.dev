import { BehaviorSubject, of } from 'rxjs';
import { MessageNewComponent } from './message-new.component';

describe('MessageNewComponent conversation handling', () => {
  let params$: BehaviorSubject<any>;
  let messageService: jasmine.SpyObj<any>;
  let cmp: MessageNewComponent;

  function create(initial: any) {
    params$ = new BehaviorSubject<any>(initial);
    messageService = jasmine.createSpyObj('MessageService', ['getMessages', 'checkOffspringThread']);
    messageService.getMessages.and.returnValue(of({ messages: [], total: 0, unread_count: 0 }));
    const offspringService = jasmine.createSpyObj('OffspringService', ['getPublicOffspring']);
    offspringService.getPublicOffspring.and.returnValue(of({ id: 'o1', name: 'Pup', gender: 'Male' }));
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
    cmp = new MessageNewComponent(
      { queryParams: params$ } as any, router, {} as any, messageService, offspringService,
      { currentUser: { id: 'me' } } as any, jasmine.createSpyObj('ToastService', ['error']), cdr
    );
    return { offspringService };
  }

  it('resumes the existing offspring conversation instead of starting a second one', () => {
    create({ breederId: 'b1', offspringId: 'o1' });
    messageService.checkOffspringThread.and.returnValue(of({ has_thread: true, thread_id: 't-existing' }));
    cmp.ngOnInit();
    expect(messageService.checkOffspringThread).toHaveBeenCalledWith('o1');
    expect(cmp.threadId).toBe('t-existing');
    expect(cmp.isLoading).toBeFalse();
  });

  it('does not look up a thread when one is already given', () => {
    create({ breederId: 'b1', offspringId: 'o1', threadId: 't1' });
    cmp.ngOnInit();
    expect(messageService.checkOffspringThread).not.toHaveBeenCalled();
    expect(cmp.threadId).toBe('t1');
  });

  it('re-keys the thread view when another conversation is selected', () => {
    create({});
    cmp.ngOnInit();
    const before = cmp.conversationKey;
    cmp.selectThread({ participant_id: 'b2', participant_name: 'B2', thread_id: 't2' } as any);
    expect(cmp.conversationKey).toBe(before + 1);
    expect(cmp.threadId).toBe('t2');
  });

  it('keeps the same thread view when the open conversation gets its id after the first send', () => {
    create({ breederId: 'b1' });
    cmp.ngOnInit();
    const before = cmp.conversationKey;
    cmp.onMessageSent('t-new');
    expect(cmp.conversationKey).toBe(before);
    expect(cmp.threadId).toBe('t-new');
  });

  it('names the person you are writing to', () => {
    create({ breederId: 'b1', breederName: 'Quiet Creek' });
    cmp.ngOnInit();
    expect(cmp.conversationName).toBe('Quiet Creek');
  });

  it('falls back to the conversation list for a thread opened by id', () => {
    create({ threadId: 't9' });
    cmp.ngOnInit();
    cmp.threads = [{ thread_id: 't9', participant_id: 'b9', participant_name: 'Maple Hill' } as any];
    expect(cmp.conversationName).toBe('Maple Hill');
    expect(cmp.conversationPartnerId).toBe('b9');
  });

  it('ignores the re-emitted params after the initialMessage prefill is stripped', () => {
    create({ breederId: 'b1', initialMessage: 'Hello' });
    cmp.ngOnInit();
    cmp.onMessageSent('t-new');
    const before = cmp.conversationKey;
    params$.next({ breederId: 'b1' }); // same conversation, prefill removed from URL
    expect(cmp.conversationKey).toBe(before);
    expect(cmp.threadId).toBe('t-new');
  });
});

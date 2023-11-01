import {
  ControlElement,
  customElements,
  Module,
  Container,
  Styles,
  MarkdownEditor,
  moment,
  IdUtils,
  Panel,
  Control,
  Markdown
} from '@ijstech/components';
import { IThread, IThreadPost } from './interface';
import dataConfig from './data.json';
import { getCurrentUser, setDataFromJson } from './store/index';
import { ScomThreadReplyInput } from './commons/index';
import { IPostData, ScomPost } from '@scom/scom-post';
import assets from './assets';
import { getHoverStyleClass } from './index.css';

export { IThreadPost };

const Theme = Styles.Theme.ThemeVars;
type callbackType = (target: ScomPost) => {}

interface ScomThreadElement extends ControlElement {
  data?: IThread;
  theme?: Markdown["theme"];
  onItemClicked?: callbackType;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['i-scom-thread']: ScomThreadElement;
    }
  }
}

@customElements('i-scom-thread')
export class ScomThread extends Module {;
  private pnlMain: Panel;
  private mainPost: ScomPost;
  private inputReply: ScomThreadReplyInput;
  private pnlActions: Panel;

  private _data: IThread = {
    posts: [],
    quotedPosts: []
  };
  private _theme: Markdown['theme'];

  tag = {
    light: {},
    dark: {}
  }
  onItemClicked: callbackType;

  constructor(parent?: Container, options?: any) {
    super(parent, options);
    if (dataConfig) setDataFromJson(dataConfig);
    this.onViewPost = this.onViewPost.bind(this);
  }

  static async create(options?: ScomThreadElement, parent?: Container) {
    let self = new this(parent, options);
    await self.ready();
    return self;
  }

  get posts() {
    return this._data.posts || [];
  }
  set posts(value: IThreadPost[]) {
    this._data.posts = value || [];
  }

  get quotedPosts() {
    return this._data.quotedPosts || [];
  }
  set quotedPosts(value: IThreadPost[]) {
    this._data.quotedPosts = value || [];
  }

  set theme(value: Markdown["theme"]) {
    this._theme = value;
    // this.updateTheme();
  }
  get theme() {
    return this._theme;
  }

  async setData(value: IThread) {
    this._data = value;
    await this.renderUI();
  }

  getData() {
    return this._data;
  }

  clear() {
    this.pnlMain.clearInnerHTML();
    if (this.inputReply) this.inputReply.clear();
  }

  private onViewPost(target: ScomPost) {
    if (this.onItemClicked) this.onItemClicked(target);
  }

  private async renderUI() {
    this.clear();
    this.renderQuotedPosts();
    if (this.posts?.length) {
      this.renderFocusedPost(this.posts[0]);
      this.appendReplyInput()
      this.renderReplies();
    }
  }

  private renderFocusedPost(post: IThreadPost) {
    this.mainPost = (
      <i-scom-post
        id={post.id}
        data={post}
        type="short"
        isActive={true}
      ></i-scom-post>
    )
    this.mainPost.onProfileClicked = (target: Control, data: IThreadPost) => this.onShowModal(target, data, 'mdThreadActions');
    this.pnlMain.appendChild(this.mainPost);
  }

  private renderQuotedPosts() {
    if (!this.quotedPosts?.length) return;
    for (let post of this.quotedPosts) {
      const postEl = <i-scom-post margin={{bottom: '0.5rem'}} display='block' data={post}></i-scom-post> as ScomPost;
      postEl.onClick = this.onViewPost;
      postEl.onReplyClicked = () => this.onViewPost(postEl);
      this.pnlMain.append(postEl);
    }
  }

  private renderReplies() {
    const length = this.posts.length - 1;
    for (let i = length; i >= 1; i--) {
      const replyEl = this.mainPost.addReply(this.mainPost.id, this.posts[i]);
      replyEl.onClick = this.onViewPost;
      replyEl.onReplyClicked = () => this.onViewPost(replyEl);
    }
  }

  private appendReplyInput(){
    const pnlReply = this.mainPost.appendReplyPanel();
    const input = (
      <i-scom-thread--reply-input
        id="inputReply"
        display='block'
        padding={{top: '0.75rem', bottom: '0.75rem', left: '1rem', right: '1rem'}}
        background={{color: Theme.background.paper}}
        margin={{top: '0.25rem'}}
        border={{radius: '.25rem'}}
        width={'100%'}
      />
    );
    input.setData({ type: 'reply' });
    input.onSubmit = this.onReplySubmit.bind(this);
    pnlReply.gap = '0.5rem';
    pnlReply.prepend(input);
  };

  private renderActions() {
    const actions = [
      {
        caption: 'Zap',
        icon: assets.fullPath('img/zap.svg')
      },
      {
        caption: 'Copy note link',
        icon: assets.fullPath('img/note_link.svg')
      },
      {
        caption: 'Copy note text',
        icon: assets.fullPath('img/note_text.svg')
      },
      {
        caption: 'Copy note ID',
        icon: assets.fullPath('img/note_id.svg')
      },
      {
        caption: 'Copy raw data',
        icon: assets.fullPath('img/raw_data.svg')
      },
      {
        caption: 'Broadcast note',
        icon: assets.fullPath('img/broadcast.svg')
      },
      {
        caption: 'Copy user public key',
        icon: assets.fullPath('img/pubkey.svg')
      },
      {
        caption: 'Mute user',
        icon: assets.fullPath('img/mute_user.svg'),
        hoveredColor: 'color-mix(in srgb, var(--colors-error-main) 25%, var(--background-paper))'
      },
      {
        caption: 'Report user',
        icon: assets.fullPath('img/report.svg'),
        hoveredColor: 'color-mix(in srgb, var(--colors-error-main) 25%, var(--background-paper))'
      }
    ]
    this.pnlActions.clearInnerHTML();
    for (let i = 0; i < actions.length; i++) {
      const item: any = actions[i];
      this.pnlActions.appendChild(
        <i-hstack
          horizontalAlignment="space-between"
          verticalAlignment="center"
          width="100%"
          padding={{top: '0.625rem', bottom: '0.625rem', left: '0.75rem', right: '0.75rem'}}
          background={{color: 'transparent'}}
          border={{radius: '0.5rem'}}
          class={getHoverStyleClass(item?.hoveredColor)}
          onClick={() => {
            if (item.onClick) item.onClick();
          }}
        >
          <i-label caption={item.caption} font={{color: Theme.colors.secondary.light, weight: 400, size: '0.875rem'}}></i-label>
          <i-image url={item.icon} width='0.75rem' height='0.75rem' display='inline-flex'></i-image>
        </i-hstack>
      )
    }
    this.pnlActions.appendChild(
      <i-hstack
        width="100%"
        horizontalAlignment="center"
        padding={{top: 12, bottom: 12, left: 16, right: 16}}
        visible={false}
        mediaQueries={[
          {
            maxWidth: '767px',
            properties: { visible: true }
          }
        ]}
      >
        <i-button
          caption='Cancel'
          width="100%" minHeight={44}
          padding={{left: 16, right: 16}}
          font={{color: Theme.text.primary, weight: 600}}
          border={{radius: '30px', width: '1px', style: 'solid', color: Theme.colors.secondary.light}}
          grid={{horizontalAlignment: 'center'}}
          background={{color: 'transparent'}}
          boxShadow="none"
          onClick={() => this.onCloseModal('mdShare')}
        ></i-button>
      </i-hstack>
    )
  }

  private onCloseModal(name: string) {
    if (this[name]) this[name].visible = false;
  }

  private onShowModal(target: Control, data: IThreadPost, name: string) {
    if (this[name]) {
      this[name].parent = target;
      this[name].position = 'absolute';
      this[name].refresh();
      this[name].visible = true;
      this[name].classList.add('show');
    }
  }

  private removeShow(name: string) {
    if (this[name]) this[name].classList.remove('show');
  }

  private onReplySubmit(target: MarkdownEditor, medias: IPostData[]) {
    const content = target.getMarkdownValue();
    const textData = {
      module: '@scom/scom-markdown-editor',
      data: {
        "properties": { content },
        "tag": {
          "width": "100%",
          "pt": 0,
          "pb": 0,
          "pl": 0,
          "pr": 0
        }
      }
    }
    const postDatas = content ? [textData, ...medias] : [...medias];
    const newPost = {
      id: IdUtils.generateUUID(),
      publishDate: moment().utc().toString(),
      author: getCurrentUser(),
      stat: {
        reply: 0,
        repost: 0,
        upvote: 0,
        downvote: 0,
        view: 0
      },
      data: [...postDatas]
    }
    const newReplyElm = this.mainPost.addReply(this.mainPost.id, newPost);
    newReplyElm.onClick = this.onViewPost;
  }

  init() {
    super.init();
    this.onItemClicked = this.getAttribute('onItemClicked', true) || this.onItemClicked;
    const data = this.getAttribute('data', true);
    if (data) this.setData(data);
    const theme = this.getAttribute('theme', true);
    const themeVar = theme || document.body.style.getPropertyValue('--theme');
    if (themeVar) this.theme = themeVar as Markdown['theme'];
    this.style.setProperty('--card-bg-color', `color-mix(in srgb, ${Theme.background.main}, #fff 3%)`);
    this.renderActions();
  }

  render() {
    return (
      <i-vstack
        id="pnlThread"
        width="100%" maxWidth={'100%'}
        margin={{left: 'auto', right: 'auto'}}
        padding={{bottom: '1rem'}}
      >
        <i-vstack id="pnlMain"></i-vstack>
        <i-vstack id="pnlComment" gap={'0.5rem'}></i-vstack>
        <i-modal
          id="mdThreadActions"
          maxWidth={'15rem'}
          minWidth={'12.25rem'}
          popupPlacement='bottomRight'
          showBackdrop={false}
          border={{radius: '0.25rem', width: '1px', style: 'solid', color: Theme.divider}}
          padding={{top: '0.5rem', left: '0.5rem', right: '0.5rem', bottom: '0.5rem'}}
          mediaQueries={[
            {
              maxWidth: '767px',
              properties: {
                showBackdrop: true,
                popupPlacement: 'bottom',
                position: 'fixed',
                zIndex: 999,
                maxWidth: '100%',
                width: '100%',
                maxHeight: '50vh',
                overflow: {y: 'auto'},
                border: {radius: '16px 16px 0 0'}
              }
            }
          ]}
          onClose={() => this.removeShow('mdThreadActions')}
        >
          <i-vstack id="pnlActions" minWidth={0} maxHeight={'27.5rem'} overflow={{y: 'auto'}}/>
        </i-modal>
      </i-vstack>
    );
  }
}

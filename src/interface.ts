import { IconName } from "@ijstech/components";

export interface IThread {
  cid: string;
}

interface IPostAnalytics {
  reply: string | number;
  repost: string | number;
  like: string | number;
  bookmark: string | number;
  view: string | number;
}

export interface IPostData {
  username: string;
  owner?: string;
  description?: string;
  dataUri?: string;
  publishDate?: number;
  replies?: IReply[];
  analytics?: IPostAnalytics;
}

export interface IReply {
  cid: string;
}

export interface IAnalytic {
  name: string;
  value: number|string;
  icon: IconName;
  class?: string;
  onClick?: () => void
}
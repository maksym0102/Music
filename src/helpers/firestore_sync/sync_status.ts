/* eslint-disable max-classes-per-file */

export abstract class SyncStatus {
  readonly progress: number = 0;
}

export class SyncInitial extends SyncStatus {}

export class SyncSongsInitial extends SyncStatus {
  progress = 1;
}

export class SyncSongsName extends SyncStatus {
  progress = 1;

  constructor(readonly name: string, readonly isDelete: boolean, readonly failed: number) {
    super();
  }
}

export class SyncSongsProgress extends SyncStatus {
  progress = 1;

  readonly timestamp: number;

  readonly totalTime: number;

  readonly percent: number;

  readonly title: string;

  constructor(progress: DownloadProgress, readonly failed: number) {
    super();
    this.timestamp = progress.timestamp;
    this.totalTime = progress.total;
    this.title = progress.title;
    this.percent = progress.percent;
  }
}

export class SyncSongsFailed extends SyncStatus {
  constructor(readonly failed: number) {
    super();
  }
}

export class SyncAlbumsInitial extends SyncStatus {
  progress = 2;
}

export class SyncAlbumsName extends SyncStatus {
  progress = 2;

  constructor(readonly name: string) {
    super();
  }
}

export class SyncCustomAlbumsInitial extends SyncStatus {
  progress = 3;
}

export class SyncCustomAlbumsName extends SyncStatus {
  progress = 3;

  constructor(readonly name: string) {
    super();
  }
}

export class SyncCleaningUp extends SyncStatus {
  progress = 4;
}

export class SyncComplete extends SyncStatus {
  progress = 5;
}

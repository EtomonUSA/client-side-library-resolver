import Library from './Library';

export default class CachedLibrary {
    public createdAt: number;

    constructor(
        public lib: Library,
        public content: string,
        createdAt: number|Date = new Date()
    ) {

        this.createdAt = Number(createdAt);
    }
}
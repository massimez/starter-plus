export type TImage = {
	url: string;
	alt?: string;
	type?: string;
	itemType?: string;
	key?: string;
	name?: string;
	size?: number;
};

export type TVideo = {
	key?: string;
	url: string;
	alt?: string;
	type?: string;
	size?: number;
	itemType?: string;
};

export type TSocialLinks = {
	facebook?: string;
	instagram?: string;
	twitter?: string; // or "x"?
	linkedin?: string;
	tiktok?: string;
	youtube?: string;
	telegram?: string;
	website?: string;
};

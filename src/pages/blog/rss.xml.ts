import { rss } from '../../components/blog/rss';
export const GET = ({ site }: { site?: URL }) => rss('es', site);

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { getPosts, repostToBluesky } from "@/api/posts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Send, Twitter, AlertCircle } from "lucide-react";

type Post = {
  _id: string;
  twitterPost: {
    id: string;
    text: string;
    createdAt: string;
    likes: number;
    retweets: number;
    account: {
      id: string;
      username: string;
      name: string;
      profileImage: string;
    };
  };
  blueskyPost: {
    id: string;
    text: string;
    createdAt: string;
    likes: number;
    reposts: number;
  } | null;
};

export function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [reposting, setReposting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await getPosts();
      setPosts(response.posts);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRepost = async (postId: string) => {
    try {
      setReposting(postId);
      const response = await repostToBluesky(postId);

      if (response.success) {
        toast({
          title: "Success",
          description: "Successfully reposted to BlueSky!",
        });

        // Update the post in the list
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? { ...post, blueskyPost: response.blueskyPost }
              : post
          )
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setReposting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Posts Dashboard</h1>
        <Button
          onClick={fetchPosts}
          variant="outline"
          className="flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="synced">Synced</TabsTrigger>
          <TabsTrigger value="unsynced">Unsynced</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <div className="grid grid-cols-2 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="space-y-6">
                  <Card className="animate-pulse">
                    <CardHeader className="bg-muted/30 h-32"></CardHeader>
                    <CardContent className="h-20 mt-4"></CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post._id} className="grid grid-cols-2 gap-6">
                  <TwitterPostCard 
                    post={post.twitterPost} 
                    hasMatch={!!post.blueskyPost}
                  />
                  <BlueSkyPostCard 
                    blueskyPost={post.blueskyPost} 
                    onRepost={() => handleRepost(post._id)}
                    isReposting={reposting === post._id}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No posts found</p>
                <p className="text-muted-foreground">Your Twitter posts will appear here once connected.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="synced">
          {loading ? (
            <div className="grid grid-cols-2 gap-6">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="space-y-6">
                  <Card className="animate-pulse">
                    <CardHeader className="bg-muted/30 h-32"></CardHeader>
                    <CardContent className="h-20 mt-4"></CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : posts.filter(post => post.blueskyPost).length > 0 ? (
            <div className="space-y-6">
              {posts
                .filter(post => post.blueskyPost)
                .map((post) => (
                  <div key={post._id} className="grid grid-cols-2 gap-6">
                    <TwitterPostCard 
                      post={post.twitterPost} 
                      hasMatch={true}
                    />
                    <BlueSkyPostCard 
                      blueskyPost={post.blueskyPost} 
                      onRepost={() => handleRepost(post._id)}
                      isReposting={reposting === post._id}
                    />
                  </div>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No synced posts found</p>
                <p className="text-muted-foreground">Posts that have been reposted to BlueSky will appear here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unsynced">
          {loading ? (
            <div className="grid grid-cols-2 gap-6">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="space-y-6">
                  <Card className="animate-pulse">
                    <CardHeader className="bg-muted/30 h-32"></CardHeader>
                    <CardContent className="h-20 mt-4"></CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : posts.filter(post => !post.blueskyPost).length > 0 ? (
            <div className="space-y-6">
              {posts
                .filter(post => !post.blueskyPost)
                .map((post) => (
                  <div key={post._id} className="grid grid-cols-2 gap-6">
                    <TwitterPostCard 
                      post={post.twitterPost} 
                      hasMatch={false}
                    />
                    <BlueSkyPostCard 
                      blueskyPost={null} 
                      onRepost={() => handleRepost(post._id)}
                      isReposting={reposting === post._id}
                    />
                  </div>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No unsynced posts found</p>
                <p className="text-muted-foreground">All your Twitter posts have been reposted to BlueSky.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

type TwitterPostProps = {
  post: {
    id: string;
    text: string;
    createdAt: string;
    likes: number;
    retweets: number;
    account: {
      id: string;
      username: string;
      name: string;
      profileImage: string;
    };
  };
  hasMatch: boolean;
};

function TwitterPostCard({ post, hasMatch }: TwitterPostProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md h-full">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.account.profileImage} alt={post.account.name} />
            <AvatarFallback>{post.account.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{post.account.name}</CardTitle>
            <CardDescription>{post.account.username}</CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto flex items-center gap-1">
            <Twitter className="h-3 w-3" />
            <span>Twitter</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-lg mb-2">{post.text}</p>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>{formatDate(post.createdAt)}</span>
          <span className="mx-2">•</span>
          <span>{post.likes} likes</span>
          <span className="mx-2">•</span>
          <span>{post.retweets} retweets</span>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Badge variant={hasMatch ? "success" : "destructive"} className="w-full flex justify-center py-1">
          {hasMatch ? "Reposted to BlueSky" : "Not reposted yet"}
        </Badge>
      </CardFooter>
    </Card>
  );
}

type BlueSkyPostProps = {
  blueskyPost: {
    id: string;
    text: string;
    createdAt: string;
    likes: number;
    reposts: number;
  } | null;
  onRepost: () => void;
  isReposting: boolean;
};

function BlueSkyPostCard({ blueskyPost, onRepost, isReposting }: BlueSkyPostProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!blueskyPost) {
    return (
      <Card className="overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-950 dark:to-sky-900 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Not on BlueSky yet</CardTitle>
            <Badge variant="outline" className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3 w-3 fill-current">
                <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2z"/>
              </svg>
              <span>BlueSky</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 flex-grow flex flex-col justify-center items-center text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">This post has not been reposted to BlueSky yet.</p>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button
            onClick={onRepost}
            disabled={isReposting}
            className="w-full"
          >
            {isReposting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Reposting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Repost to BlueSky
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md h-full">
      <CardHeader className="bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-950 dark:to-sky-900 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">BlueSky Post</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3 w-3 fill-current">
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2z"/>
            </svg>
            <span>BlueSky</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-lg mb-2">{blueskyPost.text}</p>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>{formatDate(blueskyPost.createdAt)}</span>
          <span className="mx-2">•</span>
          <span>{blueskyPost.likes} likes</span>
          <span className="mx-2">•</span>
          <span>{blueskyPost.reposts} reposts</span>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Badge variant="success" className="w-full flex justify-center py-1">
          Successfully Reposted
        </Badge>
      </CardFooter>
    </Card>
  );
}
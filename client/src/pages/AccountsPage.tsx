import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import {
  getTwitterAccounts,
  getBlueskyAccounts,
  linkAccounts,
  connectTwitterAccount,
  connectBlueskyAccount
} from "@/api/accounts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Twitter, AtSign, Link, PlusCircle, RefreshCw } from "lucide-react";

type Account = {
  id: string;
  username: string;
  name: string;
  profileImage: string;
  connected: boolean;
};

export function AccountsPage() {
  const [twitterAccounts, setTwitterAccounts] = useState<Account[]>([]);
  const [blueskyAccounts, setBlueskyAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkLoading, setLinkLoading] = useState(false);
  const [selectedTwitterId, setSelectedTwitterId] = useState('');
  const [selectedBlueskyId, setSelectedBlueskyId] = useState('');
  const [newBlueskyUsername, setNewBlueskyUsername] = useState('');
  const [newBlueskyPassword, setNewBlueskyPassword] = useState('');
  const [twitterAuthCode, setTwitterAuthCode] = useState('');
  const [openDialogTwitter, setOpenDialogTwitter] = useState(false);
  const [openDialogBluesky, setOpenDialogBluesky] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const [twitterResponse, blueskyResponse] = await Promise.all([
        getTwitterAccounts(),
        getBlueskyAccounts()
      ]);

      setTwitterAccounts(twitterResponse.accounts);
      setBlueskyAccounts(blueskyResponse.accounts);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch accounts",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccounts = async () => {
    if (!selectedTwitterId || !selectedBlueskyId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select both a Twitter and a BlueSky account",
      });
      return;
    }

    try {
      setLinkLoading(true);
      const response = await linkAccounts({
        twitterAccountId: selectedTwitterId,
        blueskyAccountId: selectedBlueskyId
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Accounts linked successfully!",
        });
        fetchAccounts();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to link accounts",
      });
    } finally {
      setLinkLoading(false);
    }
  };

  const handleConnectTwitter = async () => {
    if (!twitterAuthCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the Twitter authentication code",
      });
      return;
    }

    try {
      const response = await connectTwitterAccount(twitterAuthCode);

      if (response.success) {
        toast({
          title: "Success",
          description: "Twitter account connected successfully!",
        });
        setTwitterAccounts([...twitterAccounts, response.account]);
        setOpenDialogTwitter(false);
        setTwitterAuthCode('');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to connect Twitter account",
      });
    }
  };

  const handleConnectBluesky = async () => {
    if (!newBlueskyUsername.trim() || !newBlueskyPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both BlueSky username and password",
      });
      return;
    }

    try {
      const response = await connectBlueskyAccount({
        identifier: newBlueskyUsername,
        password: newBlueskyPassword
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "BlueSky account connected successfully!",
        });
        setBlueskyAccounts([...blueskyAccounts, response.account]);
        setOpenDialogBluesky(false);
        setNewBlueskyUsername('');
        setNewBlueskyPassword('');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to connect BlueSky account",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Account Management</h1>
        <Button
          onClick={fetchAccounts}
          variant="outline"
          className="flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Twitter Accounts */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Twitter className="h-5 w-5 text-blue-500" />
                <CardTitle>Twitter (X) Accounts</CardTitle>
              </div>
              <Dialog open={openDialogTwitter} onOpenChange={setOpenDialogTwitter}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Connect
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect Twitter (X) Account</DialogTitle>
                    <DialogDescription>
                      Enter the authentication code from Twitter to connect your account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter-code">Authentication Code</Label>
                      <Input
                        id="twitter-code"
                        placeholder="Enter your Twitter auth code"
                        value={twitterAuthCode}
                        onChange={(e) => setTwitterAuthCode(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleConnectTwitter}>Connect Account</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>Manage your connected Twitter (X) accounts</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map((i) => (
                  <div key={`item-${i}`} className="flex items-center gap-3">
                    <div key={`circle-${i}`} className="rounded-full bg-slate-200 h-10 w-10"></div>
                    <div key={`content-${i}`} className="flex-1 space-y-2">
                      <div key={`title-${i}`} className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div key={`subtitle-${i}`} className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : twitterAccounts.length > 0 ? (
              <div className="space-y-4">
                {twitterAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      selectedTwitterId === account.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                    } hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors`}
                    onClick={() => setSelectedTwitterId(account.id)}
                  >
                    <Avatar>
                      <AvatarImage src={account.profileImage} alt={account.name} />
                      <AvatarFallback>{account.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">{account.username}</p>
                    </div>
                    {account.connected && (
                      <div className="ml-auto">
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 py-1 px-2 rounded-full">
                          Connected
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <AtSign className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p>No Twitter accounts connected yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your first Twitter account to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* BlueSky Accounts */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-950 dark:to-sky-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-sky-500 fill-current">
                  <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                <CardTitle>BlueSky Accounts</CardTitle>
              </div>
              <Dialog open={openDialogBluesky} onOpenChange={setOpenDialogBluesky}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Connect
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect BlueSky Account</DialogTitle>
                    <DialogDescription>
                      Enter your BlueSky credentials to connect your account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="bluesky-username">Username</Label>
                      <Input
                        id="bluesky-username"
                        placeholder="username.bsky.social"
                        value={newBlueskyUsername}
                        onChange={(e) => setNewBlueskyUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bluesky-password">App Password</Label>
                      <Input
                        id="bluesky-password"
                        type="password"
                        placeholder="Your BlueSky app password"
                        value={newBlueskyPassword}
                        onChange={(e) => setNewBlueskyPassword(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use an app-specific password for better security
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleConnectBluesky}>Connect Account</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>Manage your connected BlueSky accounts</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map((i) => (
                  <div key={`item-${i}`} className="flex items-center gap-3">
                    <div key={`circle-${i}`} className="rounded-full bg-slate-200 h-10 w-10"></div>
                    <div key={`content-${i}`} className="flex-1 space-y-2">
                      <div key={`title-${i}`} className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div key={`subtitle-${i}`} className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : blueskyAccounts.length > 0 ? (
              <div className="space-y-4">
                {blueskyAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      selectedBlueskyId === account.id ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : ''
                    } hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors`}
                    onClick={() => setSelectedBlueskyId(account.id)}
                  >
                    <Avatar>
                      <AvatarImage src={account.profileImage} alt={account.name} />
                      <AvatarFallback>{account.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">{account.username}</p>
                    </div>
                    {account.connected && (
                      <div className="ml-auto">
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 py-1 px-2 rounded-full">
                          Connected
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <AtSign className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p>No BlueSky accounts connected yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your first BlueSky account to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Link Accounts Section */}
      <Card className="mt-6">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5 text-purple-500" />
            <CardTitle>Link Accounts</CardTitle>
          </div>
          <CardDescription>Connect your Twitter (X) account to your BlueSky account for automatic reposting</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="twitter-select" className="block mb-2">Select Twitter (X) Account</Label>
              <Select value={selectedTwitterId} onValueChange={setSelectedTwitterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Twitter account" />
                </SelectTrigger>
                <SelectContent>
                  {twitterAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bluesky-select" className="block mb-2">Select BlueSky Account</Label>
              <Select value={selectedBlueskyId} onValueChange={setSelectedBlueskyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select BlueSky account" />
                </SelectTrigger>
                <SelectContent>
                  {blueskyAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 flex justify-end">
          <Button
            onClick={handleLinkAccounts}
            disabled={!selectedTwitterId || !selectedBlueskyId || linkLoading}
            className="flex items-center gap-2"
          >
            {linkLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Link className="h-4 w-4" />
                Link Accounts
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
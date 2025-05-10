import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  FilterIcon,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useLocation } from "wouter";

// Define token schema
const tokenSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(20, "Symbol must be 20 characters or less"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z.string().optional(),
  imageUrl: z
    .string()
    .url("Image URL must be a valid URL")
    .optional()
    .or(z.literal("")),
  chain: z.string().min(1, "Chain is required"),
  contractAddress: z.string().optional().or(z.literal("")),
  decimals: z.coerce.number().int().min(0).max(18).default(18),
  isVerified: z.boolean().default(false),
});

type TokenFormValues = z.infer<typeof tokenSchema>;

// Token import schema
const tokenImportSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(20, "Symbol must be 20 characters or less"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  chain: z.string().min(1, "Chain is required"),
  contractAddress: z.string().optional().or(z.literal("")),
});

type TokenImportFormValues = z.infer<typeof tokenImportSchema>;

// Define token interface
interface Token {
  id: string;
  symbol: string;
  name: string;
  description: string | null;
  tokenRank: number | null;
  imageUrl: string | null;
  chain: string;
  contractAddress: string | null;
  decimals: number;
  totalSupply: string | null;
  maxSupply: string | null;
  isVerified: boolean;
  launchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

import { DataTable } from '@/components/admin/data-table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

// Define columns for tokens table
function getTokenColumns(
  onEdit: (token: Token) => void,
  onDelete: (token: Token) => void
): ColumnDef<Token>[] {
  return [
    {
      accessorKey: 'symbol',
      header: 'Symbol',
      cell: ({ row }) => <div className="font-medium">{row.getValue('symbol')}</div>
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'chain',
      header: 'Chain',
    },
    {
      accessorKey: 'isVerified',
      header: 'Status',
      cell: ({ row }) => {
        const isVerified = row.getValue('isVerified');
        return isVerified ? (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <Check className="h-3.5 w-3.5 mr-1" /> Verified
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            <X className="h-3.5 w-3.5 mr-1" /> Unverified
          </Badge>
        );
      },
    }
  ];
}

export default function TokenManagementPage() {
  const { user } = useAuth();
  const { getAdminAuthHeader, isAdmin } = useAdminAuth();
  const [, navigate] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChain, setFilterChain] = useState<string>("all");
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // We no longer need a redirect here as it's handled by the AdminRoute component

  // Fetch all tokens - now with admin auth headers
  const {
    data: tokens,
    isLoading,
    error,
  } = useQuery<Token[]>({
    queryKey: ["/api/admin/tokens"],
    retry: false,
    queryFn: async ({ queryKey }) => {
      const headers: HeadersInit = getAdminAuthHeader();

      const response = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text || response.statusText}`);
      }

      return await response.json();
    },
    enabled: isAdmin, // Only run the query if admin is authenticated
  });

  // Create token mutation
  const createTokenMutation = useMutation({
    mutationFn: async (data: TokenFormValues) => {
      const headers = getAdminAuthHeader();
      return await apiRequest({
        url: "/api/admin/tokens",
        method: "POST",
        data,
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tokens"] });
      toast({
        title: "Token Created",
        description: "The token has been created successfully.",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create token.",
        variant: "destructive",
      });
    },
  });

  // Update token mutation
  const updateTokenMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TokenFormValues }) => {
      const headers = getAdminAuthHeader();
      return await apiRequest({
        url: `/api/admin/tokens/${id}`,
        method: "PUT",
        data,
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tokens"] });
      toast({
        title: "Token Updated",
        description: "The token has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedToken(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update token.",
        variant: "destructive",
      });
    },
  });

  // Delete token mutation
  const deleteTokenMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = getAdminAuthHeader();
      await apiRequest({
        url: `/api/admin/tokens/${id}`,
        method: "DELETE",
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tokens"] });
      toast({
        title: "Token Deleted",
        description: "The token has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedToken(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to delete token. It might be in use in portfolios.",
        variant: "destructive",
      });
    },
  });

  // Import token mutation
  const importTokenMutation = useMutation({
    mutationFn: async (data: TokenImportFormValues) => {
      return await apiRequest({
        url: "/api/tokens/import",
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tokens"] });
      toast({
        title: "Token Imported",
        description:
          "The token has been imported successfully. It requires verification.",
      });
      setIsImportDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import token.",
        variant: "destructive",
      });
    },
  });

  // Filter tokens
  const filteredTokens = tokens?.filter((token) => {
    // Search query filter
    const matchesSearch =
      searchQuery === "" ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Chain filter
    const matchesChain = filterChain === "all" || token.chain === filterChain;

    // Verification status filter
    const matchesVerified =
      filterVerified === null || token.isVerified === filterVerified;

    return matchesSearch && matchesChain && matchesVerified;
  });

  // Get unique chains for filter dropdown
  const uniqueChains = tokens
    ? Array.from(new Set(tokens.map((token) => token.chain)))
    : [];

  // Create token form
  const addTokenForm = useForm<TokenFormValues>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      symbol: "",
      name: "",
      description: "",
      imageUrl: "",
      chain: "ethereum",
      contractAddress: "",
      decimals: 18,
    },
  });

  // Edit token form
  const editTokenForm = useForm<TokenFormValues>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      symbol: selectedToken?.symbol || "",
      name: selectedToken?.name || "",
      description: selectedToken?.description || "",
      imageUrl: selectedToken?.imageUrl || "",
      chain: selectedToken?.chain || "ethereum",
      contractAddress: selectedToken?.contractAddress || "",
      decimals: selectedToken?.decimals || 18,
      isVerified: selectedToken?.isVerified || false,
    },
  });

  // Import token form
  const importTokenForm = useForm<TokenImportFormValues>({
    resolver: zodResolver(tokenImportSchema),
    defaultValues: {
      symbol: "",
      name: "",
      chain: "ethereum",
      contractAddress: "",
    },
  });

  // Update edit form when selected token changes
  useEffect(() => {
    if (selectedToken && isEditDialogOpen) {
      console.log(
        "Resetting edit form with selected token:",
        selectedToken.name,
        "isVerified:",
        selectedToken.isVerified,
      );
      editTokenForm.reset({
        symbol: selectedToken.symbol,
        name: selectedToken.name,
        description: selectedToken.description || "",
        imageUrl: selectedToken.imageUrl || "",
        chain: selectedToken.chain,
        contractAddress: selectedToken.contractAddress || "",
        decimals: selectedToken.decimals,
        isVerified: selectedToken.isVerified,
      });
    }
  }, [selectedToken, isEditDialogOpen]);

  // Handle create token form submission
  const onAddSubmit = (data: TokenFormValues) => {
    createTokenMutation.mutate(data);
  };

  // Handle edit token form submission
  const onEditSubmit = (data: TokenFormValues) => {
    if (selectedToken) {
      updateTokenMutation.mutate({ id: selectedToken.id, data });
    }
  };

  // Handle delete token
  const onDelete = () => {
    if (selectedToken) {
      deleteTokenMutation.mutate(selectedToken.id);
    }
  };

  // Handle import token form submission
  const onImportSubmit = (data: TokenImportFormValues) => {
    importTokenMutation.mutate(data);
  };

  // Reset form when modal is closed
  const resetAddForm = () => {
    addTokenForm.reset();
    setIsAddDialogOpen(false);
  };

  const resetEditForm = () => {
    editTokenForm.reset();
    setIsEditDialogOpen(false);
    setSelectedToken(null);
  };

  const resetImportForm = () => {
    importTokenForm.reset();
    setIsImportDialogOpen(false);
  };

  // Handle API errors
  useEffect(() => {
    if (error) {
      console.error("Error loading tokens:", error);
      toast({
        title: "Error",
        description: "Failed to load tokens. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Token Management</h1>
            <p className="text-muted-foreground">
              Manage cryptocurrency tokens available in the platform
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog
              open={isImportDialogOpen}
              onOpenChange={setIsImportDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import Token
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Import Token</DialogTitle>
                  <DialogDescription>
                    Import a new token. Imported tokens will be marked as
                    unverified until approved by an admin.
                  </DialogDescription>
                </DialogHeader>
                <Form {...importTokenForm}>
                  <form
                    onSubmit={importTokenForm.handleSubmit(onImportSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={importTokenForm.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symbol</FormLabel>
                          <FormControl>
                            <Input placeholder="BTC" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={importTokenForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Bitcoin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={importTokenForm.control}
                      name="chain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chain</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select blockchain" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ethereum">Ethereum</SelectItem>
                              <SelectItem value="solana">Solana</SelectItem>
                              <SelectItem value="base">Base</SelectItem>
                              <SelectItem value="sui">Sui</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={importTokenForm.control}
                      name="contractAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Address</FormLabel>
                          <FormControl>
                            <Input placeholder="0x..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Contract address of the token (if applicable)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={resetImportForm}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={importTokenMutation.isPending}
                      >
                        {importTokenMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Import Token
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Token
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Token</DialogTitle>
                  <DialogDescription>
                    Add a new token to the platform
                  </DialogDescription>
                </DialogHeader>
                <Form {...addTokenForm}>
                  <form
                    onSubmit={addTokenForm.handleSubmit(onAddSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={addTokenForm.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symbol</FormLabel>
                          <FormControl>
                            <Input placeholder="BTC" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addTokenForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Bitcoin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addTokenForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Description of the token"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addTokenForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/image.png"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addTokenForm.control}
                      name="chain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chain</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select blockchain" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ethereum">Ethereum</SelectItem>
                              <SelectItem value="solana">Solana</SelectItem>
                              <SelectItem value="base">Base</SelectItem>
                              <SelectItem value="sui">Sui</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addTokenForm.control}
                      name="contractAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Address</FormLabel>
                          <FormControl>
                            <Input placeholder="0x..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Contract address of the token (if applicable)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addTokenForm.control}
                      name="decimals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Decimals</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Number of decimal places (typically 18 for ERC20)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={resetAddForm}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createTokenMutation.isPending}
                      >
                        {createTokenMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Add Token
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens by name or symbol..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={filterChain}
            onValueChange={(value) => setFilterChain(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Chain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chains</SelectItem>
              {uniqueChains.map((chain) => (
                <SelectItem key={chain} value={chain}>
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={
              filterVerified === null
                ? "all"
                : filterVerified
                ? "verified"
                : "unverified"
            }
            onValueChange={(value) => {
              setFilterVerified(
                value === "all"
                  ? null
                  : value === "verified"
                  ? true
                  : false
              );
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Verification status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tokens</SelectItem>
              <SelectItem value="verified">Verified Only</SelectItem>
              <SelectItem value="unverified">Unverified Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Tokens</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="unverified">Unverified</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <DataTable
              columns={getTokenColumns(
                (token: Token) => {
                  setSelectedToken(token);
                  setIsEditDialogOpen(true);
                },
                (token: Token) => {
                  setSelectedToken(token);
                  setIsDeleteDialogOpen(true);
                }
              )}
              data={filteredTokens || []}
              onEdit={(token: Token) => {
                setSelectedToken(token);
                setIsEditDialogOpen(true);
              }}
              onDelete={(token: Token) => {
                setSelectedToken(token);
                setIsDeleteDialogOpen(true);
              }}
              filterColumn="symbol"
              entityName="Token"
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="verified" className="space-y-4">
            <DataTable
              columns={getTokenColumns(
                (token: Token) => {
                  setSelectedToken(token);
                  setIsEditDialogOpen(true);
                },
                (token: Token) => {
                  setSelectedToken(token);
                  setIsDeleteDialogOpen(true);
                }
              )}
              data={(filteredTokens || []).filter((token) => token.isVerified)}
              onEdit={(token: Token) => {
                setSelectedToken(token);
                setIsEditDialogOpen(true);
              }}
              onDelete={(token: Token) => {
                setSelectedToken(token);
                setIsDeleteDialogOpen(true);
              }}
              filterColumn="symbol"
              entityName="Token"
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="unverified" className="space-y-4">
            <DataTable
              columns={getTokenColumns(
                (token: Token) => {
                  setSelectedToken(token);
                  setIsEditDialogOpen(true);
                },
                (token: Token) => {
                  setSelectedToken(token);
                  setIsDeleteDialogOpen(true);
                }
              )}
              data={(filteredTokens || []).filter((token) => !token.isVerified)}
              onEdit={(token: Token) => {
                setSelectedToken(token);
                setIsEditDialogOpen(true);
              }}
              onDelete={(token: Token) => {
                setSelectedToken(token);
                setIsDeleteDialogOpen(true);
              }}
              filterColumn="symbol"
              entityName="Token"
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Token Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Token</DialogTitle>
              <DialogDescription>
                Update token information and verification status
              </DialogDescription>
            </DialogHeader>
            <Form {...editTokenForm}>
              <form
                onSubmit={editTokenForm.handleSubmit(onEditSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={editTokenForm.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="BTC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTokenForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Bitcoin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTokenForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Description of the token"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTokenForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.png"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTokenForm.control}
                  name="chain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chain</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blockchain" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ethereum">Ethereum</SelectItem>
                          <SelectItem value="solana">Solana</SelectItem>
                          <SelectItem value="base">Base</SelectItem>
                          <SelectItem value="sui">Sui</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTokenForm.control}
                  name="contractAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Address</FormLabel>
                      <FormControl>
                        <Input placeholder="0x..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Contract address of the token (if applicable)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTokenForm.control}
                  name="decimals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decimals</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Number of decimal places (typically 18 for ERC20)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTokenForm.control}
                  name="isVerified"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Verified</FormLabel>
                        <FormDescription>
                          Verified tokens are displayed prominently in the app
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter className="mt-6">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={resetEditForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateTokenMutation.isPending}
                  >
                    {updateTokenMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Token Confirmation Dialog */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Token</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this token? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 border rounded-md">
              <p className="font-medium">{selectedToken?.name} ({selectedToken?.symbol})</p>
              <p className="text-sm text-muted-foreground">Chain: {selectedToken?.chain}</p>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={deleteTokenMutation.isPending}
              >
                {deleteTokenMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
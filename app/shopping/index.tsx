import { useQuery } from '@tanstack/react-query';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api } from '@/lib/api';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import BrowsePage, { BrowseItem, CategoryFilter } from '@/components/BrowsePage';

const shoppingCategories: CategoryFilter[] = [
  { label: 'All', icon: 'bag-handle', color: CultureTokens.indigo },
  { label: 'Groceries', icon: 'cart', color: CultureTokens.saffron },
  { label: 'Fashion', icon: 'shirt', color: CultureTokens.indigo },
  { label: 'Jewellery', icon: 'diamond', color: CultureTokens.gold },
  { label: 'Electronics', icon: 'phone-portrait', color: CultureTokens.community },
  { label: 'Health & Wellness', icon: 'leaf', color: CultureTokens.teal },
  { label: 'Books & Gifts', icon: 'book', color: CultureTokens.coral },
];

export default function ShoppingScreen() {
  const colors = useColors();
  const { state } = useOnboarding();

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['/api/shopping', state.country, state.city],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (state.country) params['country'] = state.country;
      if (state.city) params['city'] = state.city;
      return api.shopping.list(params);
    },
  });

  // Map API data to BrowseItem format
  const items: BrowseItem[] = stores.map((store: any) => ({
    id: store.id,
    title: store.name,
    subtitle: store.category,
    description: store.description,
    imageUrl: store.imageUrl,
    rating: store.rating,
    reviews: store.reviews,
    badge: store.isOpen ? 'Open' : undefined,
    isPromoted: store.isPromoted,
    meta: store.location,
    category: store.category,
    deals: store.deals,
    deliveryAvailable: store.deliveryAvailable,
  }));

  // Filter promoted items
  const promotedItems = items.filter((item) => item.isPromoted);

  const handleItemPress = (item: BrowseItem) => {
    router.push({ pathname: '/shopping/[id]', params: { id: item.id } });
  };

  const renderItemExtra = (item: BrowseItem) => {
    const deals = item.deals as any[] | undefined;
    if (!deals || deals.length === 0) return null;

    return (
      <View style={{ gap: 6 }}>
        {deals.slice(0, 2).map((deal: any, i: number) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: colors.primary + '08',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: colors.primary + '20',
            }}
          >
            <Ionicons name="pricetag" size={12} color={colors.primary} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins_500Medium',
                color: colors.text,
              }}
            >
              {deal.title}: <Text style={{ fontFamily: 'Poppins_700Bold', color: colors.primary }}>{deal.discount}</Text>
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <BrowsePage
      title="Shopping & Deals"
      accentColor={CultureTokens.teal}
      accentIcon="bag-handle"
      categories={shoppingCategories}
      categoryKey="category"
      items={items}
      isLoading={isLoading}
      promotedItems={promotedItems}
      promotedTitle="Featured Stores"
      onItemPress={handleItemPress}
      renderItemExtra={renderItemExtra}
      emptyMessage="No stores found"
      emptyIcon="bag-handle"
    />
  );
}

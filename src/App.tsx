import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'kinesiology_adjustment_methods';
const CATEGORY_STORAGE_KEY = 'kinesiology_adjustment_categories';

type Category = string;
type EnergyState = 'オーバー' | 'アンダー' | '未選択';
type ElementName = '任脈督脈' | '木' | '火' | '土' | '金' | '水';

type AdjustmentMethod = {
  id: string;
  title: string;
  category: Category;
  meridians: string[];
  elements: ElementName[];
  energyState: EnergyState;
  bodyArea: string;
  summary: string;
  procedure: string;
  whenToUse: string;
  wordsPositive: string;
  wordsNegative: string;
  metaphor: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type MeridianInfo = {
  id: number;
  name: string;
  label: string;
  element: ElementName;
};

const meridianList: MeridianInfo[] = [
  { id: 1, name: '任脈', label: '1：任脈', element: '任脈督脈' },
  { id: 2, name: '督脈', label: '2：督脈', element: '任脈督脈' },
  { id: 3, name: '胃経', label: '3：胃経', element: '土' },
  { id: 4, name: '脾経', label: '4：脾経', element: '土' },
  { id: 5, name: '心経', label: '5：心経', element: '火' },
  { id: 6, name: '小腸経', label: '6：小腸経', element: '火' },
  { id: 7, name: '膀胱経', label: '7：膀胱経', element: '水' },
  { id: 8, name: '腎経', label: '8：腎経', element: '水' },
  { id: 9, name: '心包経', label: '9：心包経', element: '火' },
  { id: 10, name: '三焦経', label: '10：三焦経', element: '火' },
  { id: 11, name: '胆経', label: '11：胆経', element: '木' },
  { id: 12, name: '肝経', label: '12：肝経', element: '木' },
  { id: 13, name: '肺経', label: '13：肺経', element: '金' },
  { id: 14, name: '大腸経', label: '14：大腸経', element: '金' },
];

const DEFAULT_CATEGORIES = ['NL', 'NV', '言葉のビタミン', 'タロット'];
const energyStates: EnergyState[] = ['オーバー', 'アンダー', '未選択'];
const elementOptions: ElementName[] = ['任脈督脈', '木', '火', '土', '金', '水'];

const DEFAULT_METHODS: AdjustmentMethod[] = [
  {
    id: 'sample-1',
    title: 'NL：アースグラウンディング調整',
    category: 'NL',
    meridians: ['任脈', '督脈'],
    elements: ['任脈督脈'],
    energyState: '未選択',
    bodyArea: '背中・中心線',
    summary: '中心線の安定と落ち着きを取り戻すためのシンプルな調整。',
    procedure: '深呼吸を促しながら、任脈・督脈のラインに意識を向ける。',
    whenToUse: 'セッションのはじめ、または気持ちが散漫なとき。',
    wordsPositive: '私は安定している。中心が整っている。',
    wordsNegative: '私は不安定だ。中心が曖昧だ。',
    metaphor: '根を張る木のように、体の中心が地面につながる。',
    notes: '軽いタッチで進めるとクライアントの抵抗感が下がる。',
    tags: ['中心線', '落ち着き', '呼吸'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const createEmptyMethod = (): AdjustmentMethod => ({
  id: crypto.randomUUID(),
  title: '',
  category: 'NL',
  meridians: [],
  elements: [],
  energyState: '未選択',
  bodyArea: '',
  summary: '',
  procedure: '',
  whenToUse: '',
  wordsPositive: '',
  wordsNegative: '',
  metaphor: '',
  notes: '',
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const getElementsFromMeridians = (meridians: string[]) => {
  return Array.from(
    new Set(
      meridians
        .map((name) => meridianList.find((item) => item.name === name)?.element)
        .filter((value): value is ElementName => Boolean(value)),
    ),
  );
};

const getMeridianLabel = (name: string) => {
  return meridianList.find((item) => item.name === name)?.label ?? name;
};

const getElementColor = (element: ElementName): string => {
  const colorMap: Record<ElementName, string> = {
    '任脈督脈': '#d4d1c9',
    '木': '#7db8a3',
    '火': '#b85d52',
    '土': '#c9a878',
    '金': '#e8e5dd',
    '水': '#3d4e6b',
  };
  return colorMap[element] ?? '#f6f2e9';
};

const getMeridianColor = (meridianName: string): string => {
  const meridian = meridianList.find((item) => item.name === meridianName);
  return meridian ? getElementColor(meridian.element) : '#f6f2e9';
};

const sanitizeCategoryList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [...DEFAULT_CATEGORIES];
  }

  const categories = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  const uniqueCategories = Array.from(new Set(categories));
  return uniqueCategories.length > 0 ? uniqueCategories : [...DEFAULT_CATEGORIES];
};

const sanitizeCategory = (value: unknown, availableCategories: string[]): Category => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed && availableCategories.includes(trimmed)) {
      return trimmed;
    }
  }
  if (availableCategories.includes('NL')) {
    return 'NL';
  }
  return availableCategories[0] ?? 'NL';
};

const sanitizeEnergyState = (value: unknown): EnergyState => {
  if (typeof value === 'string' && energyStates.includes(value as EnergyState)) {
    return value as EnergyState;
  }
  return '未選択';
};

const sanitizeArrayOfStrings = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const sanitizeAdjustmentMethod = (value: unknown, availableCategories: string[]): AdjustmentMethod => {
  const item = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  const meridians = sanitizeArrayOfStrings(item.meridians);
  const elements = getElementsFromMeridians(meridians);

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id : crypto.randomUUID(),
    title: typeof item.title === 'string' ? item.title.trim() : '',
    category: sanitizeCategory(item.category, availableCategories),
    meridians,
    elements,
    energyState: sanitizeEnergyState(item.energyState),
    bodyArea: typeof item.bodyArea === 'string' ? item.bodyArea.trim() : '',
    summary: typeof item.summary === 'string' ? item.summary.trim() : '',
    procedure: typeof item.procedure === 'string' ? item.procedure.trim() : '',
    whenToUse: typeof item.whenToUse === 'string' ? item.whenToUse.trim() : '',
    wordsPositive: typeof item.wordsPositive === 'string' ? item.wordsPositive.trim() : '',
    wordsNegative: typeof item.wordsNegative === 'string' ? item.wordsNegative.trim() : '',
    metaphor: typeof item.metaphor === 'string' ? item.metaphor.trim() : '',
    notes: typeof item.notes === 'string' ? item.notes.trim() : '',
    tags: sanitizeArrayOfStrings(item.tags),
    createdAt: typeof item.createdAt === 'string' && item.createdAt ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' && item.updatedAt ? item.updatedAt : new Date().toISOString(),
  };
};

const loadMethods = (availableCategories: string[]): AdjustmentMethod[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_METHODS;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return DEFAULT_METHODS;
    }
    return parsed.map((item) => sanitizeAdjustmentMethod(item, availableCategories));
  } catch {
    return DEFAULT_METHODS;
  }
};

const saveMethods = (methods: AdjustmentMethod[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(methods));
};

const loadCategories = (): string[] => {
  const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
  if (!raw) {
    return [...DEFAULT_CATEGORIES];
  }

  try {
    const parsed = JSON.parse(raw);
    return sanitizeCategoryList(parsed);
  } catch {
    return [...DEFAULT_CATEGORIES];
  }
};

const saveCategories = (categories: string[]) => {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
};

function App() {
  const initialCategories = loadCategories();
  const [categoriesState, setCategoriesState] = useState<string[]>(initialCategories);
  const [methods, setMethods] = useState<AdjustmentMethod[]>(() => loadMethods(initialCategories));
  const [view, setView] = useState<'list' | 'detail' | 'edit' | 'categories'>('list');
  const [selectedMethod, setSelectedMethod] = useState<AdjustmentMethod | null>(null);
  const [editingMethod, setEditingMethod] = useState<AdjustmentMethod | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | Category>('all');
  const [selectedMeridians, setSelectedMeridians] = useState<string[]>([]);
  const [filterElement, setFilterElement] = useState<'all' | ElementName>('all');
  const [filterEnergyState, setFilterEnergyState] = useState<'all' | EnergyState>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryEditDrafts, setCategoryEditDrafts] = useState<string[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [showCategoryDeleteModal, setShowCategoryDeleteModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<AdjustmentMethod[] | null>(null);
  const [importCategoryPreview, setImportCategoryPreview] = useState<string[] | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    saveMethods(methods);
  }, [methods]);

  useEffect(() => {
    saveCategories(categoriesState);
    if (filterCategory !== 'all' && !categoriesState.includes(filterCategory)) {
      setFilterCategory('all');
    }
  }, [categoriesState, filterCategory]);

  useEffect(() => {
    if (view === 'categories') {
      setCategoryEditDrafts(categoriesState);
      setCategoryMessage(null);
      setNewCategoryName('');
    }
  }, [view, categoriesState]);

  const filteredMethods = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    return methods.filter((method) => {
      if (filterCategory !== 'all' && method.category !== filterCategory) {
        return false;
      }
      if (selectedMeridians.length > 0 && !selectedMeridians.some((name) => method.meridians.includes(name))) {
        return false;
      }
      if (filterElement !== 'all' && !method.elements.includes(filterElement)) {
        return false;
      }
      if (filterEnergyState !== 'all' && method.energyState !== filterEnergyState) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const searchable = [
        method.title,
        method.summary,
        method.procedure,
        method.whenToUse,
        method.wordsPositive,
        method.wordsNegative,
        method.metaphor,
        method.notes,
        method.bodyArea,
        method.category,
        ...method.tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(needle);
    });
  }, [methods, searchText, filterCategory, selectedMeridians, filterElement, filterEnergyState]);

  const handleOpenDetail = (method: AdjustmentMethod) => {
    setSelectedMethod(method);
    setView('detail');
  };

  const toggleSelectedMeridian = (name: string) => {
    setSelectedMeridians((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  };

  const clearSelectedMeridians = () => setSelectedMeridians([]);

  const startNewMethod = () => {
    setEditingMethod(createEmptyMethod());
    setView('edit');
    setSelectedMethod(null);
  };

  const handleEditMethod = () => {
    if (!selectedMethod) return;
    setEditingMethod({ ...selectedMethod });
    setView('edit');
  };

  const handleCancelEdit = () => {
    setEditingMethod(null);
    setView('list');
    setSelectedMethod(null);
  };

  const handleSaveMethod = () => {
    if (!editingMethod) return;
    const now = new Date().toISOString();
    const elements = getElementsFromMeridians(editingMethod.meridians);
    const methodToSave: AdjustmentMethod = {
      ...editingMethod,
      elements,
      tags: sanitizeArrayOfStrings(editingMethod.tags),
      updatedAt: now,
      createdAt: editingMethod.createdAt || now,
    };

    setMethods((current) => {
      const exists = current.some((item) => item.id === methodToSave.id);
      if (exists) {
        return current.map((item) => (item.id === methodToSave.id ? methodToSave : item));
      }
      return [methodToSave, ...current];
    });
    setSelectedMethod(methodToSave);
    setEditingMethod(null);
    setView('detail');
  };

  const handleDeleteConfirmed = () => {
    if (!selectedMethod) return;
    setMethods((current) => current.filter((method) => method.id !== selectedMethod.id));
    setSelectedMethod(null);
    setView('list');
    setShowDeleteModal(false);
  };

  const handleOpenCategoryManagement = () => {
    setSelectedMethod(null);
    setCategoryMessage(null);
    setView('categories');
  };

  const handleCategoryInputChange = (index: number, value: string) => {
    setCategoryEditDrafts((current) => current.map((item, i) => (i === index ? value : item)));
    setCategoryMessage(null);
  };

  const handleAddCategory = () => {
    const nextCategory = newCategoryName.trim();
    if (!nextCategory) {
      setCategoryMessage('カテゴリ名を入力してください。');
      return;
    }
    if (categoriesState.includes(nextCategory)) {
      setCategoryMessage('同じカテゴリ名は追加できません。');
      return;
    }
    setCategoriesState((current) => [...current, nextCategory]);
    setNewCategoryName('');
    setCategoryMessage('カテゴリを追加しました。');
  };

  const handleSaveCategoryEdit = (index: number) => {
    const categoryName = categoryEditDrafts[index].trim();
    if (!categoryName) {
      setCategoryMessage('カテゴリ名は空にできません。');
      return;
    }
    const duplicate = categoriesState.some((value, i) => i !== index && value === categoryName);
    if (duplicate) {
      setCategoryMessage('同じカテゴリ名は保存できません。');
      return;
    }

    const oldName = categoriesState[index];
    if (oldName === categoryName) {
      setCategoryMessage('変更はありません。');
      return;
    }

    setCategoriesState((current) => current.map((value, i) => (i === index ? categoryName : value)));
    setMethods((current) =>
      current.map((method) =>
        method.category === oldName ? { ...method, category: categoryName } : method,
      ),
    );
    setSelectedMethod((current) =>
      current && current.category === oldName ? { ...current, category: categoryName } : current,
    );
    if (filterCategory === oldName) {
      setFilterCategory(categoryName);
    }
    setCategoryMessage('カテゴリ名を更新しました。');
  };

  const handleRequestDeleteCategory = (category: string) => {
    setCategoryToDelete(category);
    setShowCategoryDeleteModal(true);
    setCategoryMessage(null);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    setCategoriesState((current) => current.filter((item) => item !== categoryToDelete));
    if (filterCategory === categoryToDelete) {
      setFilterCategory('all');
    }
    setCategoryToDelete(null);
    setShowCategoryDeleteModal(false);
    setCategoryMessage('カテゴリを削除しました。');
  };

  const handleImportButton = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      let methodsToImport: unknown[];
      let categoriesToImport: unknown = DEFAULT_CATEGORIES;

      if (Array.isArray(parsed)) {
        methodsToImport = parsed;
      } else if (typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as any).methods)) {
        methodsToImport = (parsed as any).methods;
        categoriesToImport = (parsed as any).categories ?? DEFAULT_CATEGORIES;
      } else {
        throw new Error('JSONは調整方法の配列または { methods, categories } の構造である必要があります');
      }

      const sanitizedCategories = sanitizeCategoryList(categoriesToImport);
      const sanitizedMethods = methodsToImport.map((item) => sanitizeAdjustmentMethod(item, sanitizedCategories));
      setImportPreview(sanitizedMethods);
      setImportCategoryPreview(sanitizedCategories);
      setCategoryMessage(null);
      setShowImportConfirm(true);
      setNewCategoryName('');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'JSONの解析に失敗しました');
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    setMethods(importPreview);
    if (importCategoryPreview) {
      setCategoriesState(importCategoryPreview);
      setImportCategoryPreview(null);
    }
    setImportPreview(null);
    setShowImportConfirm(false);
    setSelectedMethod(null);
    setView('list');
  };

  const handleExportJson = () => {
    const payload = JSON.stringify({ methods, categories: categoriesState }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kinesiology_adjustment_methods.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFieldChange = (field: keyof AdjustmentMethod, value: string) => {
    if (!editingMethod) return;

    if (field === 'tags') {
      const nextTags = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      setEditingMethod({ ...editingMethod, tags: nextTags });
      return;
    }

    setEditingMethod({ ...editingMethod, [field]: value } as AdjustmentMethod);
  };

  const handleMeridianToggle = (name: string) => {
    if (!editingMethod) return;
    const nextMeridians = editingMethod.meridians.includes(name)
      ? editingMethod.meridians.filter((item) => item !== name)
      : [...editingMethod.meridians, name];
    setEditingMethod({ ...editingMethod, meridians: nextMeridians });
  };

  const currentElements = useMemo(() => {
    if (!editingMethod) return [];
    return getElementsFromMeridians(editingMethod.meridians);
  }, [editingMethod]);

  return (
    <div className="App">
      <div className="page-shell">
        <div className="header-bar">
          <h1>キネシオロジー調整リファレンス</h1>
          <p>NL・NV・言葉のビタミン・タロットの調整方法をすばやく参照・追加・編集できます。</p>
        </div>

        {view === 'list' && (
          <>
            <div className="meridian-panel">
              <div className="meridian-panel-header">
                <h2>調整する経絡を選択</h2>
                <p>複数選択できます。タップして選び直してください。</p>
              </div>
              <div className="meridian-grid-selector">
                {meridianList.map((meridian) => {
                  const selected = selectedMeridians.includes(meridian.name);
                  const bgColor = getMeridianColor(meridian.name);
                  const textColor = ['#3d4e6b', '#b85d52'].includes(bgColor) ? '#fff' : '#1f2420';
                  return (
                    <button
                      key={meridian.name}
                      type="button"
                      className={selected ? 'meridian-button selected' : 'meridian-button'}
                      style={selected ? undefined : { backgroundColor: bgColor, color: textColor }}
                      onClick={() => toggleSelectedMeridian(meridian.name)}
                    >
                      <div className="meridian-number">{meridian.id}</div>
                      <div className="meridian-name">{meridian.name}</div>
                    </button>
                  );
                })}
              </div>
              <div className="meridian-status-row">
                {selectedMeridians.length > 0 ? (
                  <>
                    <strong>選択中の経絡</strong>
                    <div className="meridian-chips">
                      {selectedMeridians.map((name) => (
                        <span key={name} className="chip-badge">{getMeridianLabel(name)}</span>
                      ))}
                    </div>
                    <button type="button" className="secondary small" onClick={clearSelectedMeridians}>選択を解除</button>
                  </>
                ) : (
                  <span className="empty-state">経絡を選択してください</span>
                )}
              </div>
            </div>

            <div className="method-header">
              {selectedMeridians.length > 0 ? (
                <>
                  <h2>選択中の経絡に対応する調整方法</h2>
                </>
              ) : (
                <>
                  <h2>すべての調整方法</h2>
                </>
              )}
            </div>

            <div className="category-tabs">
              <button
                type="button"
                className={filterCategory === 'all' ? 'category-tab active' : 'category-tab'}
                onClick={() => setFilterCategory('all')}
              >
                すべて
              </button>
              {categoriesState.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={filterCategory === category ? 'category-tab active' : 'category-tab'}
                  onClick={() => setFilterCategory(category as any)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="controls">
              <div className="filter-row">
                <div className="filter-item">
                  <label>検索</label>
                  <input
                    type="search"
                    placeholder="タイトルやタグで検索"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                <div className="filter-item">
                  <label>五行</label>
                  <select value={filterElement} onChange={(e) => setFilterElement(e.target.value as any)}>
                    <option value="all">すべて</option>
                    {elementOptions.map((element) => (
                      <option key={element} value={element}>{element}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-item">
                  <label>エネルギー状態</label>
                  <select value={filterEnergyState} onChange={(e) => setFilterEnergyState(e.target.value as any)}>
                    <option value="all">すべて</option>
                    {energyStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="action-row">
                <button type="button" onClick={startNewMethod}>新規追加</button>
                <button type="button" className="secondary" onClick={() => setView('categories')}>カテゴリ管理</button>
                <button type="button" className="secondary" onClick={handleExportJson}>JSONエクスポート</button>
                <button type="button" className="secondary" onClick={handleImportButton}>JSONインポート</button>
                <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportFile} />
              </div>
            </div>

            {importError && <div className="error-bar">インポートエラー: {importError}</div>}

            <div className="card-grid">
              {filteredMethods.length > 0 ? (
                filteredMethods.map((method) => (
                  <article key={method.id} className="method-card" onClick={() => handleOpenDetail(method)}>
                    <div className="method-card-header">
                      <div className="category-badge">{method.category}</div>
                      <h3>{method.title}</h3>
                    </div>
                    <div className="method-card-body">
                      <div className="method-info">
                        <strong>対応経絡</strong>
                        <p>{method.meridians.map(getMeridianLabel).join(', ') || '未設定'}</p>
                      </div>
                      <div className="method-info">
                        <strong>エネルギー状態</strong>
                        <p>{method.energyState}</p>
                      </div>
                    </div>
                    <div className="method-card-summary">
                      <p>{method.summary || '概要がありません。'}</p>
                    </div>
                    {method.tags.length > 0 && (
                      <div className="method-tags">
                        {method.tags.map((tag) => (
                          <span key={tag} className="tag-chip">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="method-card-footer">
                      <button type="button" className="view-detail-btn">詳細を見る</button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state-panel">
                  <p className="empty-message">この条件に合う調整方法はまだありません</p>
                  <button type="button" onClick={startNewMethod} className="empty-action-btn">新しく追加する</button>
                </div>
              )}
            </div>
          </>
        )}

        {view === 'categories' && (
          <div className="detail-panel">
            <h2>カテゴリ管理</h2>
            <div className="detail-grid">
              <div className="note-bar">カテゴリを追加・編集・削除できます。使用中のカテゴリは削除できません。</div>
              <div className="field-group full-width">
                <label>新しいカテゴリを追加</label>
                <div className="category-add-row">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="例：新しいカテゴリ"
                  />
                  <button type="button" onClick={handleAddCategory}>追加</button>
                </div>
              </div>
              <div className="category-grid">
                {categoriesState.map((category, index) => {
                  const usedCount = methods.filter((method) => method.category === category).length;
                  return (
                    <div key={category} className="category-row">
                      <input
                        value={categoryEditDrafts[index] ?? category}
                        onChange={(e) => handleCategoryInputChange(index, e.target.value)}
                      />
                      <div className="category-actions">
                        <button type="button" onClick={() => handleSaveCategoryEdit(index)}>保存</button>
                        <button
                          type="button"
                          className="secondary"
                          disabled={usedCount > 0}
                          onClick={() => handleRequestDeleteCategory(category)}
                        >
                          削除
                        </button>
                      </div>
                      {usedCount > 0 && (
                        <div className="note-bar">このカテゴリを使っている調整方法があります。先にカテゴリを変更してください。</div>
                      )}
                    </div>
                  );
                })}
              </div>
              {categoryMessage && <div className="note-bar">{categoryMessage}</div>}
            </div>
            <div className="detail-actions">
              <button type="button" className="secondary" onClick={() => setView('list')}>戻る</button>
            </div>
          </div>
        )}

        {view === 'detail' && selectedMethod && (
          <div className="detail-panel">
            <div className="detail-header">
              <div className="detail-category">{selectedMethod.category}</div>
              <h2>{selectedMethod.title}</h2>
              <div className="detail-meridians">
                <strong>対応経絡：</strong>
                {selectedMethod.meridians.map(getMeridianLabel).join(' / ') || '未設定'}
              </div>
              <div className="detail-basics">
                <div><strong>五行：</strong> {selectedMethod.elements.join(' / ') || '未設定'}</div>
                <div><strong>エネルギー：</strong> {selectedMethod.energyState}</div>
              </div>
            </div>

            <div className="detail-sections">
              {selectedMethod.summary && (
                <div className="detail-section">
                  <h3>概要</h3>
                  <p>{selectedMethod.summary}</p>
                </div>
              )}
              {selectedMethod.procedure && (
                <div className="detail-section">
                  <h3>手順</h3>
                  <p>{selectedMethod.procedure}</p>
                </div>
              )}
              {selectedMethod.whenToUse && (
                <div className="detail-section">
                  <h3>使う場面</h3>
                  <p>{selectedMethod.whenToUse}</p>
                </div>
              )}
              {selectedMethod.wordsPositive && (
                <div className="detail-section">
                  <h3>ポジティブワード</h3>
                  <p>{selectedMethod.wordsPositive}</p>
                </div>
              )}
              {selectedMethod.wordsNegative && (
                <div className="detail-section">
                  <h3>ネガティブワード</h3>
                  <p>{selectedMethod.wordsNegative}</p>
                </div>
              )}
              {selectedMethod.metaphor && (
                <div className="detail-section">
                  <h3>メタファー</h3>
                  <p>{selectedMethod.metaphor}</p>
                </div>
              )}
              {selectedMethod.notes && (
                <div className="detail-section">
                  <h3>メモ</h3>
                  <p>{selectedMethod.notes}</p>
                </div>
              )}
            </div>

            {selectedMethod.tags.length > 0 && (
              <div className="detail-tags">
                <strong>タグ：</strong>
                {selectedMethod.tags.map((tag) => (
                  <span key={tag} className="tag-chip">{tag}</span>
                ))}
              </div>
            )}

            <div className="detail-actions">
              <button type="button" onClick={handleEditMethod}>編集</button>
              <button type="button" className="secondary" onClick={() => setShowDeleteModal(true)}>削除</button>
              <button type="button" className="secondary" onClick={() => { setSelectedMethod(null); setView('list'); }}>戻る</button>
            </div>
          </div>
        )}

        {view === 'edit' && editingMethod && (
          <div className="edit-panel">
            <h2>{selectedMethod ? '調整方法を編集' : '新しい調整方法を追加'}</h2>
            <div className="detail-grid">
              <div className="field-group full-width">
                <label>タイトル</label>
                <input value={editingMethod.title} onChange={(e) => handleFieldChange('title', e.target.value)} />
              </div>
              <div className="field-group inline">
                <label>カテゴリ</label>
                <select value={editingMethod.category} onChange={(e) => handleFieldChange('category', e.target.value)}>
                  {categoriesState.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="field-group inline">
                <label>エネルギー状態</label>
                <select value={editingMethod.energyState} onChange={(e) => handleFieldChange('energyState', e.target.value)}>
                  {energyStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div className="field-group full-width">
                <label>対応経絡</label>
                <div className="meridian-grid">
                  {meridianList.map((meridian) => (
                    <label key={meridian.name} className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={editingMethod.meridians.includes(meridian.name)}
                        onChange={() => handleMeridianToggle(meridian.name)}
                      />
                      <span>{meridian.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="field-group full-width">
                <label>対応五行（自動反映）</label>
                <div className="chip">{currentElements.length > 0 ? currentElements.join(' / ') : '未設定'}</div>
              </div>
              <div className="field-group full-width">
                <label>体の部位</label>
                <input value={editingMethod.bodyArea} onChange={(e) => handleFieldChange('bodyArea', e.target.value)} />
              </div>
              <div className="field-group full-width">
                <label>概要</label>
                <textarea value={editingMethod.summary} onChange={(e) => handleFieldChange('summary', e.target.value)} />
              </div>
              <div className="field-group full-width">
                <label>手順</label>
                <textarea value={editingMethod.procedure} onChange={(e) => handleFieldChange('procedure', e.target.value)} />
              </div>
              <div className="field-group full-width">
                <label>使う場面</label>
                <textarea value={editingMethod.whenToUse} onChange={(e) => handleFieldChange('whenToUse', e.target.value)} />
              </div>
              <div className="field-group full-width">
                <label>ポジティブワード</label>
                <textarea value={editingMethod.wordsPositive} onChange={(e) => handleFieldChange('wordsPositive', e.target.value)} />
              </div>
              <div className="field-group full-width">
                <label>ネガティブワード</label>
                <textarea value={editingMethod.wordsNegative} onChange={(e) => handleFieldChange('wordsNegative', e.target.value)} />
              </div>
              <div className="field-group full-width">
                <label>メタファー</label>
                <textarea value={editingMethod.metaphor} onChange={(e) => handleFieldChange('metaphor', e.target.value)} />
              </div>
              <div className="field-group full-width">
                <label>メモ</label>
                <textarea value={editingMethod.notes} onChange={(e) => handleFieldChange('notes', e.target.value)} />
              </div>
              <div className="field-group full-width">
                <label>タグ (カンマ区切り)</label>
                <input
                  value={editingMethod.tags.join(', ')}
                  onChange={(e) => handleFieldChange('tags', e.target.value)}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={handleSaveMethod}>保存</button>
              <button type="button" className="secondary" onClick={handleCancelEdit}>キャンセル</button>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="modal-mask">
            <div className="modal-panel">
              <h3>この調整方法を削除しますか？</h3>
              <p>「削除する」を押すと、この調整方法は完全に削除されます。</p>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowDeleteModal(false)}>キャンセル</button>
                <button type="button" onClick={handleDeleteConfirmed}>削除する</button>
              </div>
            </div>
          </div>
        )}

        {showImportConfirm && importPreview && (
          <div className="modal-mask">
            <div className="modal-panel">
              <h3>既存データを上書きしますか？</h3>
              <p>インポートすると現在の調整方法データが置き換わります。</p>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => { setShowImportConfirm(false); setImportPreview(null); setImportCategoryPreview(null); }}>キャンセル</button>
                <button type="button" onClick={handleConfirmImport}>上書きしてインポート</button>
              </div>
            </div>
          </div>
        )}

        {showCategoryDeleteModal && categoryToDelete && (
          <div className="modal-mask">
            <div className="modal-panel">
              <h3>このカテゴリを削除しますか？</h3>
              <p>「削除する」を押すと、カテゴリが削除されます。使用中のカテゴリは削除できません。</p>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => { setShowCategoryDeleteModal(false); setCategoryToDelete(null); }}>キャンセル</button>
                <button type="button" onClick={handleConfirmDeleteCategory}>削除する</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

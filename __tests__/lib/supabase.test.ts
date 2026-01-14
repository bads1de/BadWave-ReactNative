/**
 * lib/supabase.ts のテスト
 * 
 * このファイルはSupabase認証クライアントの初期化とセッション管理を担当する
 * アプリケーションの認証システムの中核をテストします。
 * 
 * 注意: このテストは__mocks__/lib/supabase.tsのモックを使用します。
 * 実際の初期化ロジックは統合テストでカバーされます。
 */

describe('lib/supabase.ts', () => {
  // 各テスト前にモックをクリア
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('エクスポートされたSupabaseオブジェクト', () => {
    it('supabaseオブジェクトがエクスポートされていること', () => {
      const { supabase } = require('@/lib/supabase');

      expect(supabase).toBeDefined();
    });

    it('supabaseオブジェクトがfromメソッドを持つこと', () => {
      const { supabase } = require('@/lib/supabase');

      expect(supabase.from).toBeDefined();
      expect(typeof supabase.from).toBe('function');
    });

    it('supabaseオブジェクトがauthプロパティを持つこと', () => {
      const { supabase } = require('@/lib/supabase');

      expect(supabase.auth).toBeDefined();
      expect(typeof supabase.auth).toBe('object');
    });

    it('supabase.authがgetSessionメソッドを持つこと', () => {
      const { supabase } = require('@/lib/supabase');

      expect(supabase.auth.getSession).toBeDefined();
      expect(typeof supabase.auth.getSession).toBe('function');
    });

    it('supabase.authがsignOutメソッドを持つこと', () => {
      const { supabase } = require('@/lib/supabase');

      expect(supabase.auth.signOut).toBeDefined();
      expect(typeof supabase.auth.signOut).toBe('function');
    });

    it('supabaseオブジェクトがrpcメソッドを持つこと', () => {
      const { supabase } = require('@/lib/supabase');

      expect(supabase.rpc).toBeDefined();
      expect(typeof supabase.rpc).toBe('function');
    });

    it('supabaseオブジェクトがstorageプロパティを持つこと', () => {
      const { supabase } = require('@/lib/supabase');

      expect(supabase.storage).toBeDefined();
      expect(typeof supabase.storage).toBe('object');
    });
  });

  describe('データベース操作', () => {
    it('fromメソッドでテーブルにアクセスできること', () => {
      const { supabase } = require('@/lib/supabase');

      const table = supabase.from('test_table');

      expect(table).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('test_table');
    });

    it('selectクエリを構築できること', () => {
      const { supabase } = require('@/lib/supabase');

      const query = supabase.from('songs').select();

      expect(query).toBeDefined();
      expect(query.select).toBeDefined();
    });

    it('insertクエリを構築できること', () => {
      const { supabase } = require('@/lib/supabase');

      const query = supabase.from('songs').insert({ title: 'Test Song' });

      expect(query).toBeDefined();
      expect(query.insert).toBeDefined();
    });

    it('updateクエリを構築できること', () => {
      const { supabase } = require('@/lib/supabase');

      const query = supabase.from('songs').update({ title: 'Updated Song' });

      expect(query).toBeDefined();
      expect(query.update).toBeDefined();
    });

    it('deleteクエリを構築できること', () => {
      const { supabase } = require('@/lib/supabase');

      const query = supabase.from('songs').delete();

      expect(query).toBeDefined();
      expect(query.delete).toBeDefined();
    });
  });

  describe('認証機能', () => {
    it('getSessionメソッドが呼び出せること', async () => {
      const { supabase } = require('@/lib/supabase');

      const result = await supabase.auth.getSession();

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('getSessionが正しい形式のレスポンスを返すこと', async () => {
      const { supabase } = require('@/lib/supabase');

      const result = await supabase.auth.getSession();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
    });

    it('signOutメソッドが呼び出せること', async () => {
      const { supabase } = require('@/lib/supabase');

      const result = await supabase.auth.signOut();

      expect(result).toBeDefined();
    });

    it('signOutが正しい形式のレスポンスを返すこと', async () => {
      const { supabase } = require('@/lib/supabase');

      const result = await supabase.auth.signOut();

      expect(result).toHaveProperty('error');
    });
  });

  describe('RPC機能', () => {
    it('rpcメソッドが呼び出せること', async () => {
      const { supabase } = require('@/lib/supabase');

      const result = await supabase.rpc('test_function');

      expect(result).toBeDefined();
      expect(supabase.rpc).toHaveBeenCalledWith('test_function');
    });

    it('rpcが正しい形式のレスポンスを返すこと', async () => {
      const { supabase } = require('@/lib/supabase');

      const result = await supabase.rpc('test_function');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
    });
  });

  describe('ストレージ機能', () => {
    it('storageオブジェクトからバケットにアクセスできること', () => {
      const { supabase } = require('@/lib/supabase');

      const bucket = supabase.storage.from('test-bucket');

      expect(bucket).toBeDefined();
      expect(supabase.storage.from).toHaveBeenCalledWith('test-bucket');
    });

    it('uploadメソッドが呼び出せること', async () => {
      const { supabase } = require('@/lib/supabase');

      const bucket = supabase.storage.from('test-bucket');
      const result = await bucket.upload('test.jpg', {});

      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
    });

    it('getPublicUrlメソッドが呼び出せること', () => {
      const { supabase } = require('@/lib/supabase');

      const bucket = supabase.storage.from('test-bucket');
      const result = bucket.getPublicUrl('test.jpg');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('publicUrl');
    });
  });

  describe('クエリビルダーのメソッドチェーン', () => {
    it('select().eq()のメソッドチェーンが動作すること', () => {
      const { supabase } = require('@/lib/supabase');

      const query = supabase.from('songs').select().eq('id', 1);

      expect(query).toBeDefined();
      expect(query.select).toBeDefined();
      expect(query.eq).toBeDefined();
    });

    it('select().order()のメソッドチェーンが動作すること', () => {
      const { supabase } = require('@/lib/supabase');

      const query = supabase.from('songs').select().order('created_at');

      expect(query).toBeDefined();
      expect(query.select).toBeDefined();
      expect(query.order).toBeDefined();
    });

    it('select().limit()のメソッドチェーンが動作すること', () => {
      const { supabase } = require('@/lib/supabase');

      const query = supabase.from('songs').select().limit(10);

      expect(query).toBeDefined();
      expect(query.select).toBeDefined();
      expect(query.limit).toBeDefined();
    });

    it('複雑なクエリチェーンが動作すること', () => {
      const { supabase } = require('@/lib/supabase');

      const query = supabase
        .from('songs')
        .select()
        .eq('genre', 'rock')
        .order('created_at', { ascending: false })
        .limit(20);

      expect(query).toBeDefined();
      expect(query.select).toBeDefined();
      expect(query.eq).toBeDefined();
      expect(query.order).toBeDefined();
      expect(query.limit).toBeDefined();
    });
  });

  describe('エッジケース', () => {
    it('複数回インポートしても同じインスタンスを返すこと', () => {
      const { supabase: supabase1 } = require('@/lib/supabase');
      const { supabase: supabase2 } = require('@/lib/supabase');

      expect(supabase1).toBe(supabase2);
    });

    it('supabaseオブジェクトがnullでないこと', () => {
      const { supabase } = require('@/lib/supabase');

      expect(supabase).not.toBeNull();
      expect(supabase).not.toBeUndefined();
    });

    it('必須のプロパティがすべて存在すること', () => {
      const { supabase } = require('@/lib/supabase');

      expect(supabase.from).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.rpc).toBeDefined();
      expect(supabase.storage).toBeDefined();
    });
  });

  describe('統合シナリオ', () => {
    it('認証とデータベース操作を組み合わせたシナリオ', async () => {
      const { supabase } = require('@/lib/supabase');

      // セッションを取得
      const session = await supabase.auth.getSession();
      expect(session).toBeDefined();

      // データを取得
      const query = supabase.from('songs').select();
      expect(query).toBeDefined();
    });

    it('データベース操作とストレージ操作を組み合わせたシナリオ', () => {
      const { supabase } = require('@/lib/supabase');

      // データベースクエリ
      const dbQuery = supabase.from('songs').select();
      expect(dbQuery).toBeDefined();

      // ストレージ操作
      const bucket = supabase.storage.from('audio-files');
      expect(bucket).toBeDefined();
    });

    it('RPC呼び出しと認証を組み合わせたシナリオ', async () => {
      const { supabase } = require('@/lib/supabase');

      // セッションを取得
      const session = await supabase.auth.getSession();
      expect(session).toBeDefined();

      // RPC関数を呼び出し
      const result = await supabase.rpc('get_recommendations');
      expect(result).toBeDefined();
    });
  });
});

